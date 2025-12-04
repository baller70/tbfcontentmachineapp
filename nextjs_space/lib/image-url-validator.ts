/**
 * Image URL Validator & Proxy Utilities
 * Ensures all canvas operations use properly proxied S3 URLs with CORS headers
 */

const PROXY_API_PATH = '/api/graphics/proxy-image';

/**
 * Validates if a URL is safe for canvas operations
 * Canvas requires proper CORS headers, so we enforce proxy URLs
 */
export function isCanvasSafeUrl(url: string): boolean {
  if (!url) return false;
  
  // Allow data URLs (base64 encoded images)
  if (url.startsWith('data:image/')) return true;
  
  // Allow our proxy API URLs
  if (url.includes(PROXY_API_PATH)) return true;
  
  // Warn about direct S3 or external URLs
  if (url.includes('amazonaws.com') || url.includes('s3')) {
    console.warn('⚠️ Direct S3 URL detected. This may cause CORS issues in canvas operations.');
    return false;
  }
  
  // Allow localhost for development
  if (url.includes('localhost') || url.includes('127.0.0.1')) return true;
  
  // Other external URLs should be proxied
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.warn('⚠️ External URL detected. Consider using proxy API for canvas safety.');
    return false;
  }
  
  return true;
}

/**
 * Converts any URL to a canvas-safe proxied URL
 */
export function toCanvasSafeUrl(url: string): string {
  if (!url) return url;
  
  // Already canvas-safe
  if (isCanvasSafeUrl(url)) return url;
  
  // Convert to proxied URL
  return `${PROXY_API_PATH}?url=${encodeURIComponent(url)}`;
}

/**
 * Validates template field URLs before saving
 */
export function validateTemplateImageUrl(url: string): { valid: boolean; message?: string; fixedUrl?: string } {
  if (!url) {
    return { valid: false, message: 'Image URL is required' };
  }
  
  // Data URLs are fine
  if (url.startsWith('data:image/')) {
    return { valid: true };
  }
  
  // Check if it's already proxied
  if (url.includes(PROXY_API_PATH)) {
    return { valid: true };
  }
  
  // Direct S3 URLs should be proxied
  if (url.includes('amazonaws.com') || url.includes('s3')) {
    const fixedUrl = toCanvasSafeUrl(url);
    return {
      valid: false,
      message: 'Direct S3 URLs can cause CORS issues in canvas. Use the proxy API.',
      fixedUrl
    };
  }
  
  // External URLs should be proxied
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fixedUrl = toCanvasSafeUrl(url);
    return {
      valid: false,
      message: 'External URLs should be proxied for canvas compatibility.',
      fixedUrl
    };
  }
  
  return { valid: true };
}

/**
 * Safe image loader with automatic proxy fallback
 */
export async function loadImageSafely(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Enable CORS for cross-origin images
    img.crossOrigin = 'anonymous';
    
    let attemptedProxy = false;
    
    img.onload = () => resolve(img);
    
    img.onerror = () => {
      // If first attempt fails and we haven't tried proxy yet, try with proxy
      if (!attemptedProxy && !url.includes(PROXY_API_PATH)) {
        attemptedProxy = true;
        console.warn(`Failed to load ${url}, retrying with proxy...`);
        img.src = toCanvasSafeUrl(url);
      } else {
        reject(new Error(`Failed to load image: ${url}`));
      }
    };
    
    // Start loading with canvas-safe URL
    img.src = toCanvasSafeUrl(url);
  });
}
