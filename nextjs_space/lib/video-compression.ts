
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()
  
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      // FFmpeg progress is between 0 and 1
      onProgress(Math.round(progress * 100))
    })
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  })

  return ffmpeg
}

export interface CompressVideoOptions {
  targetSizeMB?: number
  maxSizeMB?: number
  onProgress?: (progress: number) => void
}

export async function compressVideo(
  file: File, 
  options: CompressVideoOptions = {}
): Promise<File> {
  const { 
    targetSizeMB = 4, 
    maxSizeMB = 4.5,
    onProgress 
  } = options

  const fileSizeMB = file.size / (1024 * 1024)
  
  // If file is already small enough, return it as-is
  if (fileSizeMB <= maxSizeMB) {
    return file
  }

  onProgress?.(0)

  const ffmpegInstance = await initFFmpeg(onProgress)

  try {
    const inputName = 'input.mp4'
    const outputName = 'output.mp4'

    // Write the input file to FFmpeg's virtual filesystem
    await ffmpegInstance.writeFile(inputName, await fetchFile(file))

    // Calculate compression parameters
    // Target bitrate based on desired file size and video duration
    const videoDuration = await getVideoDuration(file)
    const targetBitrate = Math.floor((targetSizeMB * 8192) / videoDuration) // kbps
    
    // Ensure minimum quality
    const finalBitrate = Math.max(targetBitrate, 500) // Minimum 500 kbps

    // Compress the video
    // Using H.264 codec with optimized settings for web
    await ffmpegInstance.exec([
      '-i', inputName,
      '-c:v', 'libx264', // Video codec
      '-preset', 'fast', // Encoding speed (fast = good balance)
      '-crf', '28', // Constant Rate Factor (23 is default, higher = more compression)
      '-b:v', `${finalBitrate}k`, // Target bitrate
      '-maxrate', `${finalBitrate * 1.5}k`, // Max bitrate
      '-bufsize', `${finalBitrate * 2}k`, // Buffer size
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
      '-c:a', 'aac', // Audio codec
      '-b:a', '128k', // Audio bitrate
      '-movflags', '+faststart', // Enable streaming
      '-y', // Overwrite output
      outputName
    ])

    // Read the compressed file
    const data = await ffmpegInstance.readFile(outputName)
    
    // Clean up
    await ffmpegInstance.deleteFile(inputName)
    await ffmpegInstance.deleteFile(outputName)

    // Create a new File object
    const compressedBlob = new Blob([data], { type: 'video/mp4' })
    const compressedFile = new File(
      [compressedBlob], 
      file.name.replace(/\.\w+$/, '.mp4'), // Ensure .mp4 extension
      { type: 'video/mp4' }
    )

    onProgress?.(100)

    const compressedSizeMB = compressedFile.size / (1024 * 1024)
    console.log(`Compression complete: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`)

    return compressedFile
  } catch (error) {
    console.error('Video compression failed:', error)
    throw new Error('Failed to compress video. Please try a smaller file.')
  }
}

// Helper function to get video duration
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

// Helper to estimate if compression is needed
export function needsCompression(file: File, maxSizeMB: number = 4.5): boolean {
  const fileSizeMB = file.size / (1024 * 1024)
  return file.type.startsWith('video/') && fileSizeMB > maxSizeMB
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
