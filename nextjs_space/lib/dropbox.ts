
import { Dropbox } from 'dropbox';
import fs from 'fs';

const AUTH_SECRETS_PATH = '/home/ubuntu/.config/abacusai_auth_secrets.json';

interface DropboxTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: Date | null;
}

// Read Dropbox access token - prioritizes env var, then App Access Token, then OAuth token with refresh
function getDropboxTokens(): DropboxTokens {
  try {
    // PRIORITY 0: Check environment variable (for production deployments)
    const envToken = process.env.DROPBOX_ACCESS_TOKEN;
    const envRefreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    
    if (envToken) {
      console.log('✅ Using Dropbox Access Token from environment variable');
      return {
        access_token: envToken,
        refresh_token: envRefreshToken,
        expires_at: null,
      };
    }

    const authData = JSON.parse(fs.readFileSync(AUTH_SECRETS_PATH, 'utf-8'));
    
    const dropboxData = authData.dropbox || authData.Dropbox;
    
    if (!dropboxData?.secrets) {
      throw new Error('Dropbox not connected');
    }
    
    // PRIORITY 1: Check for refresh token (best option - never expires, auto-renews)
    if (dropboxData.secrets.REFRESH_TOKEN?.value || dropboxData.secrets.refresh_token?.value) {
      const refreshToken = dropboxData.secrets.REFRESH_TOKEN?.value || dropboxData.secrets.refresh_token?.value;
      const accessToken = dropboxData.secrets.ACCESS_TOKEN?.value || dropboxData.secrets.access_token?.value;
      const expiresAt = dropboxData.secrets.ACCESS_TOKEN?.expires_at || dropboxData.secrets.access_token?.expires_at;
      
      console.log('✅ Using Dropbox OAuth with refresh token (automatic renewal enabled)');
      return {
        access_token: accessToken || '',
        refresh_token: refreshToken,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      };
    }
    
    // PRIORITY 2: Check for App Access Token (does not expire)
    // This is kept for backward compatibility
    if (dropboxData.secrets.ACCESS_TOKEN?.value) {
      console.log('✅ Using Dropbox App Access Token (permanent)');
      return {
        access_token: dropboxData.secrets.ACCESS_TOKEN.value,
        expires_at: null, // App tokens don't expire
      };
    }
    
    // PRIORITY 3: Fall back to OAuth access_token without refresh (expires in ~4 hours)
    // This is the worst option - will fail when token expires
    if (dropboxData.secrets.access_token?.value) {
      const tokens = {
        access_token: dropboxData.secrets.access_token.value,
        expires_at: dropboxData.secrets.access_token.expires_at ? new Date(dropboxData.secrets.access_token.expires_at) : null,
      };
      
      // Check if OAuth token is expired
      if (tokens.expires_at && tokens.expires_at < new Date()) {
        console.warn('⚠️ OAuth token expired and no refresh token available.');
        throw new Error('DROPBOX_TOKEN_EXPIRED');
      }
      
      console.log('⚠️ Using Dropbox OAuth Token without refresh (will expire in ~4 hours).');
      return tokens;
    }
    
    throw new Error('Dropbox not connected');
  } catch (error: any) {
    console.error('Error reading Dropbox tokens:', error);
    
    if (error.message === 'DROPBOX_TOKEN_EXPIRED') {
      throw new Error('Dropbox OAuth token has expired. Please reconnect Dropbox to get a refresh token.');
    }
    
    throw new Error('Dropbox authentication not found. Please connect Dropbox.');
  }
}

/**
 * Refreshes the Dropbox access token using the refresh token
 * This is called automatically when a 401 error is detected
 */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  console.log('🔄 Refreshing Dropbox access token using refresh token...');
  
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  
  if (!appKey || !appSecret) {
    throw new Error('DROPBOX_APP_KEY and DROPBOX_APP_SECRET must be set in environment variables for automatic token refresh. Please set these values.');
  }

  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: appKey,
        client_secret: appSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to refresh Dropbox token:', response.status, errorText);
      throw new Error(`Failed to refresh Dropbox token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully refreshed Dropbox access token (valid for ~4 hours)');
    
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 14400, // Default 4 hours
    };
  } catch (error: any) {
    console.error('❌ Error refreshing Dropbox token:', error);
    throw error;
  }
}

/**
 * Saves the new access token to the auth secrets file
 * Called after successfully refreshing the token
 */
function saveAccessToken(accessToken: string, expiresIn: number): void {
  try {
    if (!fs.existsSync(AUTH_SECRETS_PATH)) {
      console.warn('⚠️  Auth secrets file not found, cannot save new token');
      return;
    }

    const authSecrets = JSON.parse(fs.readFileSync(AUTH_SECRETS_PATH, 'utf-8'));
    
    if (!authSecrets.dropbox) {
      authSecrets.dropbox = { secrets: {} };
    }
    if (!authSecrets.dropbox.secrets) {
      authSecrets.dropbox.secrets = {};
    }

    // Save the new access token with expiration
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    authSecrets.dropbox.secrets.ACCESS_TOKEN = {
      value: accessToken,
      expires_at: expiresAt,
    };
    // Also update lowercase for backward compatibility
    authSecrets.dropbox.secrets.access_token = {
      value: accessToken,
      expires_at: expiresAt,
    };

    fs.writeFileSync(AUTH_SECRETS_PATH, JSON.stringify(authSecrets, null, 2));
    console.log('✅ Saved new Dropbox access token to auth secrets (valid until', new Date(expiresAt).toLocaleString(), ')');
  } catch (error) {
    console.error('❌ Error saving new Dropbox token:', error);
  }
}

// Create Dropbox client with custom fetch for serverless compatibility and automatic token refresh
function createDropboxClient(): Dropbox {
  try {
    const tokens = getDropboxTokens();
    
    // Custom fetch implementation with automatic token refresh on 401 errors
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let response = await globalThis.fetch(input, init);
      
      // If 401 Unauthorized and we have a refresh token, automatically refresh and retry
      if (response.status === 401 && tokens.refresh_token) {
        console.log('🔄 Detected 401 error, attempting to refresh Dropbox token...');
        
        try {
          const newTokens = await refreshAccessToken(tokens.refresh_token);
          saveAccessToken(newTokens.access_token, newTokens.expires_in);
          
          // Update the access token in memory for the current request
          tokens.access_token = newTokens.access_token;
          
          // Retry the request with the new token
          if (init?.headers) {
            // Update Authorization header with new token
            const headers = new Headers(init.headers);
            headers.set('Authorization', `Bearer ${newTokens.access_token}`);
            init = { ...init, headers };
          }
          
          console.log('🔄 Retrying Dropbox request with refreshed token...');
          response = await globalThis.fetch(input, init);
          console.log('✅ Request succeeded with refreshed token');
        } catch (refreshError: any) {
          console.error('❌ Failed to refresh token:', refreshError.message);
          // Return original 401 response if refresh fails
        }
      }
      
      // Add 'buffer' property that returns arrayBuffer for compatibility
      return Object.defineProperty(response, 'buffer', {
        value: response.arrayBuffer,
      });
    };
    
    return new Dropbox({
      accessToken: tokens.access_token,
      fetch: customFetch as any, // Type assertion needed for compatibility
    });
  } catch (error: any) {
    console.error('Failed to create Dropbox client:', error);
    throw new Error(`Dropbox authentication failed: ${error.message}`);
  }
}

// List folders in Dropbox
export async function listFolders(path: string = ''): Promise<Array<{ id: string; name: string; path: string }>> {
  try {
    const dbx = createDropboxClient();
    
    const response = await dbx.filesListFolder({
      path: path || '',
      limit: 2000,
    });
    
    const folders: Array<{ id: string; name: string; path: string }> = response.result.entries
      .filter((entry: any) => entry['.tag'] === 'folder')
      .map((folder: any) => ({
        id: folder.path_lower || folder.id,
        name: folder.name,
        path: folder.path_lower,
      }));
    
    return folders;
  } catch (error: any) {
    console.error('Error listing Dropbox folders:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to list Dropbox folders: ${error.message}`);
  }
}

// List files in a Dropbox folder
export async function listFilesInFolder(
  folderPath: string,
  lastChecked?: Date
): Promise<Array<{ id: string; name: string; path: string; mimeType: string; modifiedTime: string }>> {
  try {
    const dbx = createDropboxClient();
    
    const response = await dbx.filesListFolder({
      path: folderPath,
      limit: 2000,
    });
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'];
    
    let files: Array<{ id: string; name: string; path: string; mimeType: string; modifiedTime: string }> = response.result.entries
      .filter((entry: any) => {
        if (entry['.tag'] !== 'file') return false;
        const fileName = entry.name.toLowerCase();
        return imageExtensions.some(ext => fileName.endsWith(ext)) ||
               videoExtensions.some(ext => fileName.endsWith(ext));
      })
      .map((file: any) => {
        const fileName = file.name.toLowerCase();
        const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
        
        return {
          id: file.id,
          name: file.name,
          path: file.path_lower || file.path_display || file.id,
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          modifiedTime: file.client_modified || file.server_modified,
        };
      });
    
    // Filter by lastChecked if provided
    if (lastChecked) {
      files = files.filter((file: any) => new Date(file.modifiedTime) > lastChecked);
    }
    
    return files;
  } catch (error: any) {
    console.error('Error listing files in Dropbox folder:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

// Download a file from Dropbox
export async function downloadFile(filePath: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  try {
    const dbx = createDropboxClient();
    
    const response = await dbx.filesDownload({ path: filePath });
    const metadata: any = response.result;
    
    // In Node.js environments with custom fetch, the file content is in result.fileBinary
    // In browser/serverless environments with standard fetch, it's in result.fileBlob
    let buffer: Buffer;
    if (metadata.fileBinary) {
      // fileBinary is already a Buffer in Node.js
      buffer = Buffer.isBuffer(metadata.fileBinary) ? metadata.fileBinary : Buffer.from(metadata.fileBinary);
    } else if (metadata.fileBlob) {
      // fileBlob is a Blob in browser/serverless environments
      buffer = Buffer.from(await metadata.fileBlob.arrayBuffer());
    } else {
      throw new Error('No file content found in Dropbox response');
    }
    
    const fileName = metadata.name.toLowerCase();
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'];
    const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
    
    return {
      buffer,
      mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
      name: metadata.name,
    };
  } catch (error: any) {
    console.error('Error downloading file from Dropbox:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

// Get file metadata
export async function getFileMetadata(filePath: string): Promise<any> {
  try {
    const dbx = createDropboxClient();
    
    const response = await dbx.filesGetMetadata({ path: filePath });
    
    return response.result;
  } catch (error: any) {
    console.error('Error getting file metadata from Dropbox:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
}

// Delete a file from Dropbox
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const dbx = createDropboxClient();
    
    await dbx.filesDeleteV2({ path: filePath });
    
    console.log(`✅ Deleted file from Dropbox: ${filePath}`);
  } catch (error: any) {
    console.error('Error deleting file from Dropbox:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Upload file to Dropbox
export async function uploadFile(filePath: string, fileContent: Buffer): Promise<{ path: string; name: string }> {
  try {
    const dbx = createDropboxClient();
    
    const response = await dbx.filesUpload({
      path: filePath,
      contents: fileContent,
      mode: { '.tag': 'overwrite' },
      autorename: false,
      mute: false,
    });
    
    console.log(`✅ Uploaded file to Dropbox: ${response.result.path_display}`);
    
    return {
      path: response.result.path_display || response.result.path_lower || filePath,
      name: response.result.name,
    };
  } catch (error: any) {
    console.error('❌ Failed to upload file to Dropbox:', error);
    if (error.status === 401) {
      throw new Error('Dropbox access token has expired. Please reconnect your Dropbox account in Settings.');
    }
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Check if Dropbox is connected
export function isDropboxConnected(): boolean {
  try {
    getDropboxTokens();
    return true;
  } catch {
    return false;
  }
}
