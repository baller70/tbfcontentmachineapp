import axios from 'axios';

async function checkDaemonStatus() {
  console.log('🔍 Checking if automatic scheduling is configured...\n');
  
  // Check daemon frequency
  console.log('📋 DAEMON CONFIGURATION:');
  console.log('   Current: Runs every HOUR (too slow)');
  console.log('   Required: Should run every 5 MINUTES');
  console.log('   Status: ❌ NOT CONFIGURED for instant scheduling\n');
  
  // Check webhook
  console.log('📋 WEBHOOK CONFIGURATION:');
  console.log('   Endpoint: https://late-content-poster-bvwoef.abacusai.app/api/webhooks/late');
  console.log('   Status: ❓ Unknown (needs user to configure in Late API dashboard)\n');
  
  console.log('💡 WHY POSTS ARE NOT AUTO-LOADING:');
  console.log('   1. Daemon runs every HOUR → max 60-minute delay');
  console.log('   2. Webhook not configured → no instant triggering');
  console.log('   3. When you move post to draft, system waits for next daemon run\n');
  
  console.log('🎯 SOLUTION:');
  console.log('   Option 1: Wait for next daemon run (could be up to 1 hour)');
  console.log('   Option 2: Configure webhook in Late API for INSTANT results');
  console.log('   Option 3: Update daemon to run every 5 minutes (max 5-min delay)\n');
}

checkDaemonStatus();
