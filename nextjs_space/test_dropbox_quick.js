require('dotenv').config();
const { Dropbox } = require('dropbox');

async function test() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  console.log('Token:', token ? token.substring(0, 30) + '...' : 'NOT FOUND');
  
  if (!token) {
    console.error('NO TOKEN');
    return;
  }
  
  const dbx = new Dropbox({ accessToken: token, fetch });
  
  try {
    const response = await dbx.filesListFolder({ path: '' });
    console.log('✅ SUCCESS - Found', response.result.entries.length, 'items');
  } catch (error) {
    console.error('❌ ERROR:', error.status, error.error?.error_summary || error.message);
  }
}

test();
