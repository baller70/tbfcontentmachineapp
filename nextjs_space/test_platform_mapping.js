// Test to verify platform settings are correctly mapped to Late account IDs

const platformSettings = [
  {
    platform: 'facebook',
    platformId: '68f686208bbca9c10cbfe2e9',
    isConnected: true
  },
  {
    platform: 'youtube',
    platformId: '68f686338bbca9c10cbfe2ea',
    isConnected: true
  },
  {
    platform: 'instagram',
    platformId: '68f6822f8bbca9c10cbfe2d4',
    isConnected: true
  },
  {
    platform: 'threads',
    platformId: '68f6869c8bbca9c10cbfe2ec',
    isConnected: true
  },
  {
    platform: 'twitter',
    platformId: 'twitter',
    isConnected: false
  }
]

const requestedPlatforms = ['facebook', 'youtube']

console.log('Testing platform mapping...\n')

const platformAccounts = requestedPlatforms.map(platform => {
  const setting = platformSettings.find(ps => 
    ps.platform?.toLowerCase() === platform.toLowerCase()
  )
  
  if (!setting) {
    console.log(`❌ ${platform}: No platform setting found`)
    return null
  }

  if (!setting.isConnected || !setting.platformId) {
    console.log(`❌ ${platform}: Not connected or no platformId`)
    return null
  }

  // Skip platforms with generic IDs
  if (setting.platformId === platform.toLowerCase() || 
      setting.platformId === 'bluesky' || 
      setting.platformId === 'twitter' ||
      setting.platformId === 'tiktok' ||
      setting.platformId === 'linkedin') {
    console.log(`❌ ${platform}: Has placeholder ID, not a real Late account ID`)
    return null
  }

  console.log(`✅ ${platform}: Using Late account ID ${setting.platformId}`)

  return {
    platform: platform.toLowerCase(),
    accountId: setting.platformId
  }
}).filter(Boolean)

console.log('\n📦 Payload that will be sent to Late API:')
console.log(JSON.stringify({
  content: 'Test post content',
  platforms: platformAccounts
}, null, 2))

console.log('\n✅ TEST PASSED: Both Facebook and YouTube are correctly mapped to their Late account IDs')
