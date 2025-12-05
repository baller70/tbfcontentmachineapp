#!/bin/bash
API_KEY="sk_cc9fbf4e284b0a16469fdd61025973bffe76cd92993842e9773b01d9b266318f"
BASE_URL="https://getlate.dev/api/v1/posts"

# Basketball Factory Account IDs
BF_TIKTOK="68f687b18bbca9c10cbfe2f0"
BF_YOUTUBE="68f687c48bbca9c10cbfe2f2"
BF_FACEBOOK="68f687638bbca9c10cbfe2ef"

# Rise As One Account IDs
RAO_INSTAGRAM="68f6822f8bbca9c10cbfe2d4"
RAO_FACEBOOK="68f80c018bbca9c10cbfe63f"
RAO_YOUTUBE="68f686338bbca9c10cbfe2ea"

VIDEO_URL="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
IMAGE_URL="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"

echo "=== BASKETBALL FACTORY - 7 Posts ==="

# BF Post 3 - YouTube
echo "BF #3 YouTube:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #3 - Basketball Factory YouTube! #TBF\",\"platforms\":[{\"platform\":\"youtube\",\"accountId\":\"$BF_YOUTUBE\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T20:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# BF Post 4 - YouTube
echo "BF #4 YouTube:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #4 - Basketball Factory YouTube2! #TBF\",\"platforms\":[{\"platform\":\"youtube\",\"accountId\":\"$BF_YOUTUBE\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T20:30:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# BF Post 5 - Facebook Image
echo "BF #5 Facebook:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #5 - Basketball Factory Facebook! #TBF\",\"platforms\":[{\"platform\":\"facebook\",\"accountId\":\"$BF_FACEBOOK\"}],\"mediaItems\":[{\"type\":\"image\",\"url\":\"$IMAGE_URL\"}],\"scheduledFor\":\"2025-12-05T21:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# BF Post 6 - Facebook Video
echo "BF #6 Facebook:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #6 - Basketball Factory FBVideo! #TBF\",\"platforms\":[{\"platform\":\"facebook\",\"accountId\":\"$BF_FACEBOOK\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T21:30:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# BF Post 7 - TikTok
echo "BF #7 TikTok:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #7 - Basketball Factory TikTok Final! #TBF\",\"platforms\":[{\"platform\":\"tiktok\",\"accountId\":\"$BF_TIKTOK\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T22:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

echo ""
echo "=== RISE AS ONE AAU - 7 Posts ==="

# RAO Post 1 - Instagram
echo "RAO #1 Instagram:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #1 - Rise As One Instagram! #RiseAsOne\",\"platforms\":[{\"platform\":\"instagram\",\"accountId\":\"$RAO_INSTAGRAM\"}],\"mediaItems\":[{\"type\":\"image\",\"url\":\"$IMAGE_URL\"}],\"scheduledFor\":\"2025-12-05T19:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 2 - Instagram
echo "RAO #2 Instagram:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #2 - Rise As One Instagram2! #RiseAsOne\",\"platforms\":[{\"platform\":\"instagram\",\"accountId\":\"$RAO_INSTAGRAM\"}],\"mediaItems\":[{\"type\":\"image\",\"url\":\"$IMAGE_URL\"}],\"scheduledFor\":\"2025-12-05T19:30:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 3 - Instagram
echo "RAO #3 Instagram:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #3 - Rise As One Instagram3! #RiseAsOne\",\"platforms\":[{\"platform\":\"instagram\",\"accountId\":\"$RAO_INSTAGRAM\"}],\"mediaItems\":[{\"type\":\"image\",\"url\":\"$IMAGE_URL\"}],\"scheduledFor\":\"2025-12-05T20:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 4 - Facebook
echo "RAO #4 Facebook:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #4 - Rise As One Facebook! #RiseAsOne\",\"platforms\":[{\"platform\":\"facebook\",\"accountId\":\"$RAO_FACEBOOK\"}],\"mediaItems\":[{\"type\":\"image\",\"url\":\"$IMAGE_URL\"}],\"scheduledFor\":\"2025-12-05T20:30:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 5 - Facebook Video
echo "RAO #5 Facebook:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #5 - Rise As One FBVideo! #RiseAsOne\",\"platforms\":[{\"platform\":\"facebook\",\"accountId\":\"$RAO_FACEBOOK\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T21:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 6 - YouTube
echo "RAO #6 YouTube:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #6 - Rise As One YouTube! #RiseAsOne\",\"platforms\":[{\"platform\":\"youtube\",\"accountId\":\"$RAO_YOUTUBE\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T21:30:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

# RAO Post 7 - YouTube
echo "RAO #7 YouTube:"
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" \
  -d "{\"content\":\"🏀 BULK CREATE TEST #7 - Rise As One YouTube Final! #RiseAsOne\",\"platforms\":[{\"platform\":\"youtube\",\"accountId\":\"$RAO_YOUTUBE\"}],\"mediaItems\":[{\"type\":\"video\",\"url\":\"$VIDEO_URL\"}],\"scheduledFor\":\"2025-12-05T22:00:00.000Z\",\"publishNow\":false}" | jq -r '.post._id + " - " + .post.status'

echo ""
echo "=== DONE ==="

