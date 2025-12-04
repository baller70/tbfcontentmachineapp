require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compare() {
  const basketballFactory = await prisma.profile.findFirst({
    where: { name: 'Basketball Factory' },
    include: { platformSettings: true }
  });
  
  const riseAsOne = await prisma.profile.findFirst({
    where: { name: 'Rise As One' },
    include: { platformSettings: true }
  });
  
  console.log('========== BASKETBALL FACTORY ==========');
  console.log('Late Profile ID:', basketballFactory?.lateProfileId);
  console.log('\nPlatform Settings:');
  basketballFactory?.platformSettings.forEach(ps => {
    console.log(`  ${ps.platform}:`);
    console.log(`    - platformId: ${ps.platformId}`);
    console.log(`    - isConnected: ${ps.isConnected}`);
    console.log(`    - isActive: ${ps.isActive}`);
  });
  
  console.log('\n========== RISE AS ONE ==========');
  console.log('Late Profile ID:', riseAsOne?.lateProfileId);
  console.log('\nPlatform Settings:');
  riseAsOne?.platformSettings.forEach(ps => {
    console.log(`  ${ps.platform}:`);
    console.log(`    - platformId: ${ps.platformId}`);
    console.log(`    - isConnected: ${ps.isConnected}`);
    console.log(`    - isActive: ${ps.isActive}`);
  });
  
  console.log('\n========== DIFFERENCES ==========');
  
  // Compare Facebook
  const bfFacebook = basketballFactory?.platformSettings.find(ps => ps.platform === 'facebook');
  const raoFacebook = riseAsOne?.platformSettings.find(ps => ps.platform === 'facebook');
  console.log('\nFacebook:');
  console.log('  Basketball Factory:', bfFacebook?.platformId, '- Connected:', bfFacebook?.isConnected);
  console.log('  Rise As One:', raoFacebook?.platformId, '- Connected:', raoFacebook?.isConnected);
  
  // Compare YouTube
  const bfYoutube = basketballFactory?.platformSettings.find(ps => ps.platform === 'youtube');
  const raoYoutube = riseAsOne?.platformSettings.find(ps => ps.platform === 'youtube');
  console.log('\nYouTube:');
  console.log('  Basketball Factory:', bfYoutube?.platformId, '- Connected:', bfYoutube?.isConnected);
  console.log('  Rise As One:', raoYoutube?.platformId, '- Connected:', raoYoutube?.isConnected);
}

compare().finally(() => prisma.$disconnect());
