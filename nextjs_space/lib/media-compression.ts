
/**
 * Server-side video and image compression utilities for Node.js
 * Uses fluent-ffmpeg for videos and sharp for images
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

// Dynamically set ffmpeg path at runtime (not during build)
let ffmpegConfigured = false;

function configureFfmpeg() {
  if (!ffmpegConfigured) {
    try {
      // Try to use @ffmpeg-installer first
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
      ffmpegConfigured = true;
    } catch (error) {
      // Fallback to system ffmpeg
      try {
        ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
        ffmpegConfigured = true;
        console.log('Using system ffmpeg at /usr/bin/ffmpeg');
      } catch (fallbackError) {
        console.error('Failed to configure ffmpeg:', error);
        throw new Error('Cannot find ffmpeg');
      }
    }
  }
}

export interface CompressionOptions {
  maxSizeMB?: number; // Maximum file size in MB
  maxWidth?: number; // Maximum width in pixels
  maxHeight?: number; // Maximum height in pixels
  quality?: 'high' | 'medium' | 'low'; // Quality preset
  videoBitrate?: string; // e.g., '1000k', '2M'
  audioBitrate?: string; // e.g., '128k'
  targetPlatform?: 'late' | 'twitter' | 'youtube' | 'instagram' | 'generic';
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  sizeMB: number;
  codec: string;
  bitrate?: number;
}

/**
 * Get platform-specific compression settings
 */
function getPlatformSettings(platform: string): {
  maxSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  videoBitrate: string;
} {
  const settings = {
    late: { maxSizeMB: 10, maxWidth: 1280, maxHeight: 720, videoBitrate: '800k' }, // Reduced from 100MB to 10MB
    twitter: { maxSizeMB: 5, maxWidth: 1280, maxHeight: 720, videoBitrate: '1000k' },
    youtube: { maxSizeMB: 256, maxWidth: 1920, maxHeight: 1080, videoBitrate: '5000k' },
    instagram: { maxSizeMB: 100, maxWidth: 1080, maxHeight: 1350, videoBitrate: '2000k' },
    generic: { maxSizeMB: 50, maxWidth: 1280, maxHeight: 720, videoBitrate: '1500k' }
  };
  
  return settings[platform as keyof typeof settings] || settings.generic;
}

/**
 * Get video metadata using ffprobe
 */
export async function getVideoMetadata(buffer: Buffer): Promise<VideoMetadata> {
  configureFfmpeg();
  
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `video-probe-${Date.now()}.mp4`);
    
    try {
      fs.writeFileSync(tempFile, buffer);
      
      ffmpeg.ffprobe(tempFile, (err, metadata) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch {}
        
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }
        
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          sizeMB: buffer.length / (1024 * 1024),
          codec: videoStream.codec_name || 'unknown',
          bitrate: metadata.format.bit_rate
        });
      });
    } catch (error) {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
      reject(error);
    }
  });
}

/**
 * Compress video to meet platform requirements
 */
export async function compressVideo(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  configureFfmpeg();
  
  console.log(`🎬 Starting video compression...`);
  console.log(`   Input size: ${(inputBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
  
  // Get platform-specific settings
  const platform = options.targetPlatform || 'generic';
  const platformSettings = getPlatformSettings(platform);
  
  const maxSizeMB = options.maxSizeMB || platformSettings.maxSizeMB;
  const maxWidth = options.maxWidth || platformSettings.maxWidth;
  const maxHeight = options.maxHeight || platformSettings.maxHeight;
  const videoBitrate = options.videoBitrate || platformSettings.videoBitrate;
  const audioBitrate = options.audioBitrate || '128k';
  
  // Check if compression is needed
  const currentSizeMB = inputBuffer.length / (1024 * 1024);
  if (currentSizeMB <= maxSizeMB * 0.9) {
    console.log(`✅ Video is already within size limits (${currentSizeMB.toFixed(2)} MB <= ${maxSizeMB} MB)`);
    return inputBuffer;
  }
  
  return new Promise((resolve, reject) => {
    const inputFile = path.join(os.tmpdir(), `video-input-${Date.now()}.mp4`);
    const outputFile = path.join(os.tmpdir(), `video-output-${Date.now()}.mp4`);
    
    try {
      // Write input buffer to temp file
      fs.writeFileSync(inputFile, inputBuffer);
      
      console.log(`🔄 Compressing video...`);
      console.log(`   Target: ${maxSizeMB} MB max, ${maxWidth}x${maxHeight} max resolution`);
      console.log(`   Bitrate: ${videoBitrate}, Audio: ${audioBitrate}`);
      
      // Compress video with ffmpeg
      ffmpeg(inputFile)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate(videoBitrate)
        .audioBitrate(audioBitrate)
        .size(`${maxWidth}x?`) // Maintain aspect ratio
        .autopad()
        .outputOptions([
          '-movflags +faststart', // Enable streaming
          '-pix_fmt yuv420p', // Compatibility
          '-preset medium', // Encoding speed/quality balance
          '-crf 23' // Quality (lower = better, 18-28 is good range)
        ])
        .output(outputFile)
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          try {
            const compressedBuffer = fs.readFileSync(outputFile);
            const compressedSizeMB = compressedBuffer.length / (1024 * 1024);
            
            console.log(`✅ Video compressed successfully`);
            console.log(`   Output size: ${compressedSizeMB.toFixed(2)} MB`);
            console.log(`   Reduction: ${((1 - compressedSizeMB / currentSizeMB) * 100).toFixed(1)}%`);
            
            // Clean up temp files
            try {
              fs.unlinkSync(inputFile);
              fs.unlinkSync(outputFile);
            } catch {}
            
            // If still too large, try more aggressive compression
            if (compressedSizeMB > maxSizeMB) {
              console.log(`⚠️  Video still exceeds ${maxSizeMB} MB after compression`);
              console.log(`   Consider reducing duration or using lower quality settings`);
            }
            
            resolve(compressedBuffer);
          } catch (error) {
            // Clean up on error
            try {
              fs.unlinkSync(inputFile);
              fs.unlinkSync(outputFile);
            } catch {}
            reject(error);
          }
        })
        .on('error', (err) => {
          // Clean up on error
          try {
            fs.unlinkSync(inputFile);
            fs.unlinkSync(outputFile);
          } catch {}
          
          console.error(`❌ Video compression failed:`, err.message);
          reject(err);
        })
        .run();
    } catch (error) {
      // Clean up on error
      try {
        fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch {}
      reject(error);
    }
  });
}

/**
 * Compress image to meet platform requirements
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  console.log(`🖼️  Starting image compression...`);
  console.log(`   Input size: ${(inputBuffer.length / 1024).toFixed(2)} KB`);
  
  // Get platform-specific settings
  const platform = options.targetPlatform || 'generic';
  const platformSettings = getPlatformSettings(platform);
  
  const maxSizeMB = options.maxSizeMB || platformSettings.maxSizeMB;
  const maxWidth = options.maxWidth || platformSettings.maxWidth;
  const maxHeight = options.maxHeight || platformSettings.maxHeight;
  
  // Check if compression is needed
  const currentSizeMB = inputBuffer.length / (1024 * 1024);
  if (currentSizeMB <= maxSizeMB * 0.9) {
    console.log(`✅ Image is already within size limits (${(currentSizeMB * 1024).toFixed(2)} KB <= ${maxSizeMB * 1024} KB)`);
    return inputBuffer;
  }
  
  try {
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    console.log(`   Original dimensions: ${metadata.width}x${metadata.height}`);
    
    // Calculate new dimensions if needed
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }
    
    // Start with high quality
    let quality = 85;
    let compressedBuffer: Buffer;
    
    console.log(`🔄 Compressing image...`);
    console.log(`   Target: ${maxSizeMB} MB max, ${width}x${height} resolution`);
    
    // Iteratively compress until we meet size requirements
    do {
      compressedBuffer = await sharp(inputBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      
      const compressedSizeMB = compressedBuffer.length / (1024 * 1024);
      console.log(`   Quality ${quality}: ${(compressedSizeMB * 1024).toFixed(2)} KB`);
      
      if (compressedSizeMB <= maxSizeMB) {
        console.log(`✅ Image compressed successfully`);
        console.log(`   Output size: ${(compressedSizeMB * 1024).toFixed(2)} KB`);
        console.log(`   Reduction: ${((1 - compressedSizeMB / currentSizeMB) * 100).toFixed(1)}%`);
        return compressedBuffer;
      }
      
      quality -= 10;
    } while (quality >= 30);
    
    // If we still can't get it small enough, reduce dimensions further
    if (compressedBuffer.length / (1024 * 1024) > maxSizeMB) {
      console.log(`⚠️  Reducing dimensions further to meet size limit`);
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      
      compressedBuffer = await sharp(inputBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
      
      const finalSizeMB = compressedBuffer.length / (1024 * 1024);
      console.log(`✅ Image compressed with reduced dimensions`);
      console.log(`   Output size: ${(finalSizeMB * 1024).toFixed(2)} KB`);
      console.log(`   Final dimensions: ${width}x${height}`);
    }
    
    return compressedBuffer;
  } catch (error) {
    console.error(`❌ Image compression failed:`, error);
    throw error;
  }
}

/**
 * Detect if buffer is a video or image
 */
export function isVideo(buffer: Buffer): boolean {
  // Check magic bytes for common video formats
  const header = buffer.subarray(0, 12);
  
  // MP4/MOV (ftyp)
  if (header.includes(Buffer.from('ftyp'))) {
    return true;
  }
  
  // AVI (RIFF...AVI )
  if (header.subarray(0, 4).toString() === 'RIFF' && 
      header.subarray(8, 12).toString() === 'AVI ') {
    return true;
  }
  
  // WebM (EBML)
  if (header.subarray(0, 4).toString('hex') === '1a45dfa3') {
    return true;
  }
  
  return false;
}

/**
 * Detect if buffer is an image
 */
export function isImage(buffer: Buffer): boolean {
  const header = buffer.subarray(0, 12);
  
  // JPEG
  if (header[0] === 0xFF && header[1] === 0xD8) {
    return true;
  }
  
  // PNG
  if (header.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return true;
  }
  
  // GIF
  if (header.subarray(0, 3).toString() === 'GIF') {
    return true;
  }
  
  // WebP
  if (header.subarray(0, 4).toString() === 'RIFF' && 
      header.subarray(8, 12).toString() === 'WEBP') {
    return true;
  }
  
  return false;
}

/**
 * Automatically compress media based on type and platform
 */
export async function compressMediaAuto(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  if (isVideo(buffer)) {
    return compressVideo(buffer, options);
  } else if (isImage(buffer)) {
    return compressImage(buffer, options);
  } else {
    throw new Error('Unsupported media type');
  }
}
