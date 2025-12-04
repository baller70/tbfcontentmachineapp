import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBothProfiles() {
  try {
    console.log('\n=== CHECKING ALL PROFILES ===\n');
    
    const profiles = await prisma.profile.findMany({
      include: {
        platformSettings: true
      }
    });
    
    for (const profile of profiles) {
      console.log(`\nProfile: ${profile.name} (ID: ${profile.id})`);
      console.log(`Late Profile ID: ${profile.lateProfileId || 'NOT SET'}`);
      console.log(`Platforms in DB:`);
      
      for (const platform of profile.platformSettings) {
        console.log(`  - ${platform.platform}: ${platform.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
        console.log(`    Platform ID: ${platform.platformId || 'N/A'}`);
        console.log(`    Is Active: ${platform.isActive ? 'YES' : 'NO'}`);
      }
    }
    
    console.log('\n=== LATE API CHECK ===\n');
    
    // Check Late API for each profile
    const lateApiKey = process.env.LATE_API_KEY;
    if (!lateApiKey) {
      console.log('LATE_API_KEY not found in environment');
      return;
    }
    
    for (const profile of profiles) {
      if (profile.lateProfileId) {
        console.log(`\nFetching Late data for ${profile.name} (Late Profile ID: ${profile.lateProfileId})...`);
        
        const response = await fetch(`https://api.late.so/api/v1/users/${profile.lateProfileId}`, {
          headers: {
            'Authorization': `Bearer ${lateApiKey}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Late API response for ${profile.name}:`);
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(`Failed to fetch from Late API: ${response.status}`);
        }
      } else {
        console.log(`\n${profile.name} has no Late Profile ID set`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBothProfiles();
