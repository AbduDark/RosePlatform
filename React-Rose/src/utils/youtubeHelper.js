/**
 * تحويل أي رابط يوتيوب إلى صيغة embed
 * @param {string} url - رابط اليوتيوب (youtube.com/watch, youtu.be, shorts, live, embed)
 * @returns {string|null} - رابط embed أو null لو الرابط مش صحيح
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) return null;

    // لو الرابط embed بالفعل، نرجعه زي ما هو
    if (trimmedUrl.includes('youtube.com/embed/')) {
      return trimmedUrl;
    }

    let videoId = null;

    // تنسيق: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }

    // تنسيق: https://youtu.be/VIDEO_ID
    if (!videoId) {
      const shortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }
    }

    // تنسيق: https://www.youtube.com/shorts/VIDEO_ID
    if (!videoId) {
      const shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) {
        videoId = shortsMatch[1];
      }
    }

    // تنسيق: https://www.youtube.com/live/VIDEO_ID
    if (!videoId) {
      const liveMatch = trimmedUrl.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) {
        videoId = liveMatch[1];
      }
    }

    // تنسيق: https://m.youtube.com/watch?v=VIDEO_ID (mobile)
    if (!videoId) {
      const mobileMatch = trimmedUrl.match(/m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (mobileMatch) {
        videoId = mobileMatch[1];
      }
    }

    // تنسيق: https://www.youtube.com/v/VIDEO_ID
    if (!videoId) {
      const vMatch = trimmedUrl.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
      if (vMatch) {
        videoId = vMatch[1];
      }
    }

    // لو لقينا الـ video ID، نرجع رابط embed
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // لو مش قادرين نستخرج الـ ID، نرجع null
    console.warn('Could not extract YouTube video ID from URL:', trimmedUrl);
    return null;
  } catch (error) {
    console.error('Error converting YouTube URL:', error);
    return null;
  }
};

/**
 * التحقق من صحة رابط اليوتيوب
 * @param {string} url - رابط اليوتيوب
 * @returns {boolean} - true لو الرابط صحيح
 */
export const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/).+/;
  return youtubeRegex.test(trimmedUrl);
};
