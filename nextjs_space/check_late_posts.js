const https = require('https');
require('dotenv').config();

const options = {
  hostname: 'getlate.dev',
  path: '/api/v1/posts?limit=5',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.LATE_API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const posts = JSON.parse(data);
    console.log('\n' + '='.repeat(100));
    console.log('RECENT LATE API POSTS');
    console.log('='.repeat(100));
    
    posts.slice(0, 5).forEach(post => {
      console.log('\n' + '-'.repeat(100));
      console.log('🆔 Post ID:', post._id);
      console.log('🕐 Created:', post.createdAt);
      console.log('📊 Status:', post.status);
      console.log('📦 Platforms:', post.platforms.map(p => p.platform).join(', '));
      console.log('\n📝 CONTENT:');
      console.log(post.content);
      console.log('-'.repeat(100));
    });
  });
});

req.on('error', (e) => { console.error('Error:', e); });
req.end();
