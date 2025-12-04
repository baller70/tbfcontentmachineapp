const { Dropbox } = require('dropbox');
const fs = require('fs');

async function test() {
  // Load the token from auth secrets (the permanent one)
  const authSecrets = JSON.parse(fs.readFileSync('/home/ubuntu/.config/abacusai_auth_secrets.json', 'utf8'));
  const token = authSecrets.dropbox?.secrets?.access_token?.value;
  
  console.log('Testing token from auth secrets:', token ? token.substring(0, 30) + '...' : 'NOT FOUND');
  
  if (!token) {
    console.error('NO TOKEN IN AUTH SECRETS');
    return;
  }
  
  const dbx = new Dropbox({ accessToken: token, fetch });
  
  try {
    const response = await dbx.filesListFolder({ path: '' });
    console.log('✅ SUCCESS - Token is valid! Found', response.result.entries.length, 'items');
    console.log('\nFirst 5 folders:');
    response.result.entries.slice(0, 5).forEach(entry => {
      console.log(`  - ${entry.name}`);
    });
  } catch (error) {
    console.error('❌ ERROR:', error.status, error.error?.error_summary || error.message);
  }
}

test();
