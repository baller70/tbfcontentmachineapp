#!/bin/bash
# Run the series processor every 5 minutes
cd /home/ubuntu/late_content_poster/nextjs_space
npx tsx scripts/process_scheduled_series.ts >> /tmp/series-processor-5min.log 2>&1
