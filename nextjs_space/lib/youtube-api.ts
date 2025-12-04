
/**
 * YouTube Data API v3 Integration
 * Provides functionality for uploading videos, managing playlists, and retrieving analytics
 */

import { google, youtube_v3 } from 'googleapis';

/**
 * Get YouTube API key from environment
 */
function getYouTubeApiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY;
}

/**
 * Create YouTube client with API key
 */
export function createYouTubeClient(): youtube_v3.Youtube {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in environment variables.');
  }

  return google.youtube({
    version: 'v3',
    auth: apiKey,
  });
}

/**
 * Create OAuth2 authenticated YouTube client
 * Used for operations that require user authentication (uploads, likes, etc.)
 */
export function createAuthenticatedYouTubeClient(accessToken: string): youtube_v3.Youtube {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
}

/**
 * Search for videos by keyword
 */
export async function searchVideos(query: string, maxResults: number = 10) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      order: 'relevance',
    });

    return {
      success: true,
      videos: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error: any) {
    console.error('YouTube search error:', error);
    return {
      success: false,
      error: error.message,
      videos: [],
    };
  }
}

/**
 * Get video details by ID
 */
export async function getVideoDetails(videoId: string) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'status'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return {
        success: false,
        error: 'Video not found',
      };
    }

    return {
      success: true,
      video: response.data.items[0],
    };
  } catch (error: any) {
    console.error('YouTube get video details error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get channel details by ID
 */
export async function getChannelDetails(channelId: string) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings'],
      id: [channelId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return {
        success: false,
        error: 'Channel not found',
      };
    }

    return {
      success: true,
      channel: response.data.items[0],
    };
  } catch (error: any) {
    console.error('YouTube get channel details error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get video statistics (views, likes, comments)
 */
export async function getVideoStatistics(videoId: string) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.videos.list({
      part: ['statistics'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return {
        success: false,
        error: 'Video not found',
      };
    }

    const stats = response.data.items[0].statistics;

    return {
      success: true,
      statistics: {
        viewCount: parseInt(stats?.viewCount || '0'),
        likeCount: parseInt(stats?.likeCount || '0'),
        commentCount: parseInt(stats?.commentCount || '0'),
        favoriteCount: parseInt(stats?.favoriteCount || '0'),
      },
    };
  } catch (error: any) {
    console.error('YouTube get statistics error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get trending videos by region
 */
export async function getTrendingVideos(regionCode: string = 'US', maxResults: number = 10) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      chart: 'mostPopular',
      regionCode,
      maxResults,
    });

    return {
      success: true,
      videos: response.data.items || [],
    };
  } catch (error: any) {
    console.error('YouTube get trending videos error:', error);
    return {
      success: false,
      error: error.message,
      videos: [],
    };
  }
}

/**
 * Get video comments
 */
export async function getVideoComments(videoId: string, maxResults: number = 20) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults,
      order: 'relevance',
    });

    return {
      success: true,
      comments: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error: any) {
    console.error('YouTube get comments error:', error);
    return {
      success: false,
      error: error.message,
      comments: [],
    };
  }
}

/**
 * Get playlist details
 */
export async function getPlaylistDetails(playlistId: string) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      id: [playlistId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return {
        success: false,
        error: 'Playlist not found',
      };
    }

    return {
      success: true,
      playlist: response.data.items[0],
    };
  } catch (error: any) {
    console.error('YouTube get playlist details error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get videos from a playlist
 */
export async function getPlaylistVideos(playlistId: string, maxResults: number = 50) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId,
      maxResults,
    });

    return {
      success: true,
      videos: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error: any) {
    console.error('YouTube get playlist videos error:', error);
    return {
      success: false,
      error: error.message,
      videos: [],
    };
  }
}

/**
 * Search channels by keyword
 */
export async function searchChannels(query: string, maxResults: number = 10) {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults,
    });

    return {
      success: true,
      channels: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error: any) {
    console.error('YouTube search channels error:', error);
    return {
      success: false,
      error: error.message,
      channels: [],
    };
  }
}

/**
 * Get video categories for a region
 */
export async function getVideoCategories(regionCode: string = 'US') {
  const youtube = createYouTubeClient();

  try {
    const response = await youtube.videoCategories.list({
      part: ['snippet'],
      regionCode,
    });

    return {
      success: true,
      categories: response.data.items || [],
    };
  } catch (error: any) {
    console.error('YouTube get categories error:', error);
    return {
      success: false,
      error: error.message,
      categories: [],
    };
  }
}

/**
 * Check if YouTube API is configured
 */
export function isYouTubeConfigured(): boolean {
  return !!getYouTubeApiKey();
}
