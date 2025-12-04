import { Dropbox } from 'dropbox';
import * as fs from 'fs';

async function testConnection() {
  console.log('\n🔍 Testing Dropbox Connection...\n');
  
  // Try auth secrets
  const authSecretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
  let token: string | null = null;
  let expiresAt: string | null = null;
  
  try {
    const authSecrets = JSON.parse(fs.readFileSync(authSecretsPath, 'utf8'));
    token = authSecrets.dropbox?.secrets?.access_token?.value;
    expiresAt = authSecrets.dropbox?.secrets?.access_token?.expires_at;
    console.log('✓ Found token in auth secrets');
    console.log('  Token:', token?.substring(0, 20) + '...');
    console.log('  Expires:', expiresAt || 'Unknown');
    
    // Check if expired
    if (expiresAt) {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      console.log(`  Time remaining: ${hoursRemaining.toFixed(1)} hours`);
      
      if (now >= expiry) {
        console.log('  ⚠️  Token has EXPIRED');
      }
    }
  } catch (err: any) {
    console.log('✗ Could not load auth secrets:', err.message);
  }
  
  if (!token) {
    console.log('❌ No Dropbox token found');
    return;
  }
  
  const dbx = new Dropbox({ accessToken: token });
  
  try {
    const response = await dbx.filesListFolder({ path: '' });
    console.log('\n✅ Dropbox connection successful!');
    console.log(`📁 Found ${response.result.entries.length} items in root folder`);
    
    if (response.result.entries.length > 0) {
      console.log('\n📂 Sample folders:');
      response.result.entries.slice(0, 5).forEach((item: any) => {
        console.log(`   ${item['.tag'] === 'folder' ? '📁' : '📄'} ${item.name}`);
      });
    }
    
    console.log('\n✅ Token is valid and working!');
  } catch (err: any) {
    console.log('\n❌ Dropbox connection failed:', err.message);
    if (err.status === 401) {
      console.log('🔑 Token is expired or invalid. Need to refresh or reconnect.');
    }
    console.log('\nFull error:', err);
  }
}

testConnection().catch(console.error);
