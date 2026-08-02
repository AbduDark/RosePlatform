import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaSpinner,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCog,
} from "react-icons/fa";
import { getLessonDetails, getVideoInfo } from "../../api/lessons";
import { useAuth } from "../../context/AuthContext";
import VideoProtection from "../common/VideoProtection";
import YouTubeSecurePlayer from "./YouTubeSecurePlayer";

const VideoPlayer = ({ lessonId, lessonData, onLessonChange, onVideoEnd }) => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  const [lessonDetails, setLessonDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);

  // Reset video player states
  const resetPlayerStates = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Load lesson details and initialize video
  useEffect(() => {
    const loadLessonDetails = async () => {
      if (!lessonId) return;

      setIsLoading(true);
      resetPlayerStates();

      try {
        let lessonDataToUse = lessonData;

        if (!lessonDataToUse) {
          const response = await getLessonDetails(lessonId, token);
          lessonDataToUse = response.data || response;
        }

        // Fetch detailed video info (including secure youtube embed_url if available)
        try {
          const infoRes = await getVideoInfo(lessonId, token);
          if (infoRes?.data) {
            lessonDataToUse = { ...lessonDataToUse, ...infoRes.data };
          }
        } catch (vErr) {
          console.warn("Could not fetch video info payload:", vErr);
        }

        setLessonDetails(lessonDataToUse);

        if (lessonDataToUse.video_source === 'youtube' && lessonDataToUse.embed_url) {
          // YouTube mode handled directly in render
          setIsLoading(false);
          return;
        }

        if (lessonDataToUse.has_video && lessonDataToUse.video_url) {
          initializeVideoPlayer(lessonDataToUse.video_url);
        } else {
          setError(t("lessons.videoPlayer.noVideo", "لم يتم رفع الفيديو الخاص بهذا الدرس بعد"));
        }
      } catch (err) {
        console.error("Error loading lesson details:", err);
        setError(err.message || t("lessons.videoPlayer.loadError", "خطأ في تحميل الفيديو"));
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonDetails();

    return () => {
      resetPlayerStates();
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      retryCountRef.current = 0;
    };
  }, [lessonId, lessonData, token, t, resetPlayerStates]);

  // Initialize video player with HLS support
  const initializeVideoPlayer = useCallback(
    (videoUrl) => {
      if (!videoRef.current) return;

      console.log("Initializing video player with URL:", videoUrl);

      resetPlayerStates();

      const isHls = /\.m3u8(\?.*)?$/i.test(videoUrl);
      console.log("Video type - HLS:", isHls);

      if (isHls) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            xhrSetup: function(xhr, url) {
              xhr.withCredentials = false;
            },
            manifestLoadingRetryDelay: 1000,
            manifestLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 1000,
            levelLoadingMaxRetry: 4,
            fragLoadingRetryDelay: 1000,
            fragLoadingMaxRetry: 6,
          });

          hls.loadSource(videoUrl);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("HLS manifest parsed successfully");
            
            if (hls.levels && hls.levels.length > 0) {
              const qualities = hls.levels.map((level, index) => ({
                index: index,
                height: level.height,
                width: level.width,
                bitrate: level.bitrate,
                label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`
              }));
              
              qualities.sort((a, b) => (b.height || 0) - (a.height || 0));
              
              setAvailableQualities([
                { index: -1, label: 'Auto', isAuto: true },
                ...qualities
              ]);
              
              console.log('Available qualities:', qualities);
            }
            
            setError(null);
            videoRef.current.play().catch((err) => {
              console.error("Auto-play failed:", err);
              setIsPlaying(false);
            });
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS error:", data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("Network error, trying to recover...");
                  if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++;
                    const retryDelay = 2000 * retryCountRef.current;
                    setError(`فشل تحميل الفيديو. جاري إعادة المحاولة (${retryCountRef.current}/${maxRetries})...`);
                    
                    if (retryTimeoutRef.current) {
                      clearTimeout(retryTimeoutRef.current);
                    }
                    
                    retryTimeoutRef.current = setTimeout(() => {
                      console.log(`Retry attempt ${retryCountRef.current}/${maxRetries} after ${retryDelay}ms`);
                      hls.startLoad();
                      retryTimeoutRef.current = null;
                    }, retryDelay);
                  } else {
                    hls.destroy();
                    hlsRef.current = null;
                    setError(t("lessons.videoPlayer.networkError", "فشل تحميل الفيديو بعد عدة محاولات (${max}/${max}). يرجى التحقق من اتصال الإنترنت وتحديث الصفحة.", { max: maxRetries }));
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Media error, trying to recover...");
                  if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++;
                    const retryDelay = 2000 * retryCountRef.current;
                    setError(`خطأ في تشغيل الفيديو. جاري إعادة المحاولة (${retryCountRef.current}/${maxRetries})...`);
                    
                    if (retryTimeoutRef.current) {
                      clearTimeout(retryTimeoutRef.current);
                    }
                    
                    retryTimeoutRef.current = setTimeout(() => {
                      console.log(`Recovering from media error, attempt ${retryCountRef.current}/${maxRetries} after ${retryDelay}ms`);
                      hls.recoverMediaError();
                      retryTimeoutRef.current = null;
                    }, retryDelay);
                  } else {
                    hls.destroy();
                    hlsRef.current = null;
                    setError(t("lessons.videoPlayer.mediaError", "خطأ في فك تشفير الفيديو بعد ${max} محاولات. يرجى تحديث الصفحة أو استخدام متصفح آخر.", { max: maxRetries }));
                  }
                  break;
                default:
                  console.error("Fatal error, cannot recover", data);
                  hls.destroy();
                  hlsRef.current = null;
                  setError(t("lessons.videoPlayer.fatalError", "حدث خطأ فادح في تشغيل الفيديو. يرجى تحديث الصفحة والمحاولة مرة أخرى."));
                  break;
              }
            } else if (data.details === 'bufferStalledError') {
              console.warn("Buffer stalled, attempting recovery...");
            }
          });
          
          // مراقبة نجاح التشغيل لإخفاء رسائل الخطأ
          videoRef.current.addEventListener('playing', () => {
            console.log("Video is now playing successfully");
            setError(null);
            retryCountRef.current = 0;
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          });

          hlsRef.current = hls;
          return;
        }

        if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = videoUrl;
          videoRef.current.load();
          return;
        }

        setError(t("lessons.videoPlayer.hlsNotSupported", "المتصفح لا يدعم تشغيل الفيديو"));
        return;
      }

      videoRef.current.src = videoUrl;
      
      if (videoRef.current) {
        videoRef.current.setAttribute('crossorigin', 'anonymous');
      }
      
      videoRef.current.load();

      videoRef.current.onerror = (e) => {
        console.error("Video load error:", e);
        const mediaError = videoRef.current?.error;
        let errorMsg = t("lessons.videoPlayer.loadError", "خطأ في تحميل الفيديو");
        let shouldRetry = false;
        
        if (mediaError) {
          switch(mediaError.code) {
            case mediaError.MEDIA_ERR_ABORTED:
              errorMsg = "تم إلغاء تحميل الفيديو. يرجى المحاولة مرة أخرى.";
              break;
            case mediaError.MEDIA_ERR_NETWORK:
              errorMsg = "خطأ في الشبكة أثناء تحميل الفيديو. جاري إعادة المحاولة...";
              shouldRetry = true;
              break;
            case mediaError.MEDIA_ERR_DECODE:
              errorMsg = "فشل فك تشفير الفيديو. قد يكون الملف تالفاً.";
              break;
            case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = "تنسيق الفيديو غير مدعوم أو الرابط غير صحيح.";
              break;
          }
        }
        
        if (shouldRetry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setError(`${errorMsg} (${retryCountRef.current}/${maxRetries})`);
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.src = videoUrl;
              videoRef.current.load();
              videoRef.current.play().catch(err => console.error("Play failed after retry:", err));
            }
          }, 2000 * retryCountRef.current);
        } else {
          setError(errorMsg);
        }
      };

      videoRef.current.onloadeddata = () => {
        console.log("Video loaded successfully");
        setError(null);
        retryCountRef.current = 0;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        videoRef.current.play().catch((err) => {
          console.error("Auto-play failed:", err);
          setIsPlaying(false);
        });
      };
    },
    [t, resetPlayerStates]
  );

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Play failed:", err);
          setError(t("lessons.videoPlayer.playError", "فشل تشغيل الفيديو"));
        });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const handleSeek = (seekTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onVideoEnd?.();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  const handleQualityChange = useCallback((qualityIndex) => {
    if (!hlsRef.current) return;
    
    const currentTime = videoRef.current?.currentTime || 0;
    const wasPlaying = isPlaying;
    
    if (qualityIndex === -1) {
      hlsRef.current.currentLevel = -1;
      setCurrentQuality('auto');
    } else {
      hlsRef.current.currentLevel = qualityIndex;
      const selectedQuality = availableQualities.find(q => q.index === qualityIndex);
      setCurrentQuality(selectedQuality?.label || 'auto');
    }
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play();
        }
      }
    }, 100);
    
    setShowQualityMenu(false);
  }, [availableQualities, isPlaying]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div
        className="relative w-full bg-black rounded-lg"
        style={{ paddingTop: "56.25%" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <FaSpinner className="animate-spin text-4xl mb-4 mx-auto" />
            <p className="text-lg">{t("lessons.videoPlayer.loading", "جاري التحميل...")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isVideoNotUploaded = error.includes("لم يتم رفع") || error.includes("لا يوجد فيديو");
    
    if (isVideoNotUploaded) {
      return (
        <div
          className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-xl"
          style={{ paddingTop: "56.25%" }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t("lessons.videoPlayer.noVideo", "لم يتم رفع الفيديو الخاص بهذا الدرس بعد")}
              </h3>
              <p className="text-gray-300 text-lg mb-4">
                {t("lessons.videoPlayer.videoComingSoon", "فيديو هذا الدرس سيتم رفعه قريباً")}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-300 text-sm font-medium">
                  {t("lessons.videoPlayer.checkBackLater", "يرجى المتابعة في وقت لاحق")}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div
        className="relative w-full bg-gradient-to-br from-red-900/30 to-gray-900 rounded-lg shadow-xl border border-red-500/20"
        style={{ paddingTop: "56.25%" }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-3">
              {t("lessons.videoPlayer.error", "حدث خطأ")}
            </h3>
            <p className="text-red-300 text-base mb-2">{error}</p>
            <p className="text-gray-400 text-sm">
              {t("lessons.videoPlayer.noVideoDescription", "يرجى التحقق لاحقاً أو التواصل مع المدرس")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (lessonDetails?.video_source === 'youtube' && lessonDetails?.embed_url) {
    return (
      <YouTubeSecurePlayer
        embedUrl={lessonDetails.embed_url}
        lessonTitle={lessonDetails.title}
        lessonId={lessonId}
      />
    );
  }

  return (
    <VideoProtection
      lessonId={lessonId}
      userId={user?.id}
    >
      <div ref={containerRef} className="relative w-full bg-black rounded-lg overflow-hidden group">
        {/* Protected Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white">
            <FaShieldAlt />
            <span>{t("lessons.videoPlayer.protected", "محمي")}</span>
          </div>
        </div>

        {/* Video Element */}
        <div className="relative" style={{ paddingTop: "56.25%" }}>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onEnded={handleVideoEnd}
            onMouseMove={handleMouseMove}
            onClick={isPlaying ? handlePause : handlePlay}
            controls={false}
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            crossOrigin="anonymous"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Video Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
          
          {/* Security Watermark */}
          {user && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-10 text-white text-2xl font-bold rotate-[-30deg] whitespace-nowrap">
              {user.name || user.email} • ID: {user.id}
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onMouseMove={handleMouseMove}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div
                className="relative h-1 bg-gray-600 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  const seekTime = percentage * duration;
                  handleSeek(seekTime);
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="hover:text-gray-300 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                </button>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={handleMuteToggle}
                    className="hover:text-gray-300 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    aria-label="Volume"
                  />
                </div>

                <div className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {lessonDetails && (
                  <div className="text-sm text-right rtl:text-left hidden md:block">
                    <div className="font-medium">{lessonDetails.title}</div>
                  </div>
                )}

                {availableQualities.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="flex items-center space-x-1 rtl:space-x-reverse hover:text-gray-300 transition-colors text-sm"
                      aria-label="Quality settings"
                    >
                      <FaCog size={16} />
                      <span>{currentQuality}</span>
                    </button>
                    
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                        {availableQualities.map((quality) => (
                          <button
                            key={quality.index}
                            onClick={() => handleQualityChange(quality.index)}
                            className={`w-full px-4 py-2 text-left rtl:text-right hover:bg-gray-700 transition-colors text-sm ${
                              (quality.isAuto && currentQuality === 'auto') || 
                              (quality.label === currentQuality) 
                                ? 'bg-gray-700 text-white' 
                                : 'text-gray-300'
                            }`}
                          >
                            {quality.label}
                            {quality.isAuto && ` (${t("lessons.videoPlayer.auto", "تلقائي")})`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleFullscreenToggle}
                  className="hover:text-gray-300 transition-colors"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VideoProtection>
  );
};

export default VideoPlayer;
