const fs = require('fs');

// Test which token is being used
console.log('🔍 Testing Dropbox Token Configuration\n');

// Check environment variable
const envToken = process.env.DROPBOX_ACCESS_TOKEN;
if (envToken) {
  console.log('✅ Found DROPBOX_ACCESS_TOKEN in environment');
  console.log(`   Token starts with: ${envToken.substring(0, 20)}...`);
  console.log(`   Token length: ${envToken.length} characters\n`);
} else {
  console.log('❌ No DROPBOX_ACCESS_TOKEN in environment\n');
}

// Check auth secrets file
try {
  const authData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/abacusai_auth_secrets.json', 'utf-8'));
  const dropboxData = authData.dropbox || authData.Dropbox;
  
  if (dropboxData?.secrets?.ACCESS_TOKEN?.value) {
    console.log('✅ Found ACCESS_TOKEN (uppercase) in auth secrets');
    console.log(`   Token: ${dropboxData.secrets.ACCESS_TOKEN.value}\n`);
  } else {
    console.log('❌ No ACCESS_TOKEN (uppercase) in auth secrets\n');
  }
  
  if (dropboxData?.secrets?.access_token?.value) {
    console.log('✅ Found access_token (lowercase) in auth secrets');
    console.log(`   Token: ${dropboxData.secrets.access_token.value}`);
    if (dropboxData.secrets.access_token.expires_at) {
      console.log(`   Expires at: ${dropboxData.secrets.access_token.expires_at}`);
      const expiryDate = new Date(dropboxData.secrets.access_token.expires_at);
      const now = new Date();
      console.log(`   Is expired? ${expiryDate < now}\n`);
    } else {
      console.log(`   No expiry date (might be permanent)\n`);
    }
  } else {
    console.log('❌ No access_token (lowercase) in auth secrets\n');
  }
} catch (error) {
  console.error('Error reading auth secrets:', error.message);
}

// Test the actual token with Dropbox API
console.log('🧪 Testing token with Dropbox API...\n');
const { Dropbox } = require('dropbox');

async function testToken(token, tokenName) {
  try {
    const dbx = new Dropbox({ accessToken: token });
    const result = await dbx.filesListFolder({ path: '' });
    console.log(`✅ ${tokenName}: SUCCESS - Found ${result.result.entries.length} items in root`);
    console.log(`   Folders/files:`);
    result.result.entries.slice(0, 5).forEach(entry => {
      console.log(`     - ${entry.name} (${entry['.tag']})`);
    });
    return true;
  } catch (error) {
    console.log(`❌ ${tokenName}: FAILED`);
    console.log(`   Error: ${error.error?.error_summary || error.message}`);
    return false;
  }
}

(async () => {
  // Test env token first
  if (envToken) {
    await testToken(envToken, 'Environment Token');
  }
  
  // Test auth secrets token
  const authData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/abacusai_auth_secrets.json', 'utf-8'));
  const dropboxData = authData.dropbox || authData.Dropbox;
  
  if (dropboxData?.secrets?.access_token?.value) {
    console.log('\n');
    await testToken(dropboxData.secrets.access_token.value, 'Auth Secrets Token');
  }
})();
