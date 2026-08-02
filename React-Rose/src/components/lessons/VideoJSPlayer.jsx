import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";


const VideoJSPlayer = ({ videoUrl, lessonId, lessonTitle, onVideoEnd, qualitySources }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuality, setCurrentQuality] = useState(null);
  const initTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  useEffect(() => {
    if (!videoUrl) {
      console.warn("No video URL provided for lesson:", lessonId);
      return;
    }

    const errorMessages = {
      loadError: t("lessons.videoPlayer.loadError", "حدث خطأ أثناء تحميل الفيديو"),
      videoNotAvailable: t("lessons.videoPlayer.videoNotAvailable", "الفيديو غير متوفر حالياً"),
      formatNotSupported: t("lessons.videoPlayer.formatNotSupported", "صيغة الفيديو غير مدعومة")
    };

    if (playerRef.current) {
      try {
        playerRef.current.dispose();
      } catch (err) {
        console.warn("Error disposing previous player:", err);
      }
      playerRef.current = null;
    }

    const tryInitializePlayer = () => {
      // Check if ref exists
      if (!videoRef.current) {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          initTimeoutRef.current = setTimeout(tryInitializePlayer, 150);
        } else {
          console.error("Max retries reached: video element ref not available");
          setError("فشل تهيئة مشغل الفيديو - العنصر غير متاح");
        }
        return;
      }

      // Check if element is connected to DOM and visible
      const isConnected = videoRef.current.isConnected;
      const isInDocument = document.body.contains(videoRef.current);
      const hasParent = videoRef.current.parentElement !== null;
      
      if (!isConnected || !isInDocument || !hasParent) {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retry ${retryCountRef.current}/${maxRetries}: Waiting for DOM connection...`);
          initTimeoutRef.current = setTimeout(tryInitializePlayer, 150);
        } else {
          console.error("Max retries reached: video element not connected to DOM");
          // Component might be unmounting, don't show error
          return;
        }
        return;
      }

      const videoElement = videoRef.current;
      retryCountRef.current = 0;

      console.log("Initializing VideoJS player for lesson:", lessonId);

      try {
        const player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: "auto",
          playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
          controlBar: {
            children: [
              "playToggle",
              "volumePanel",
              "currentTimeDisplay",
              "timeDivider",
              "durationDisplay",
              "progressControl",
              "playbackRateMenuButton",
              "qualitySelector",
              "fullscreenToggle",
            ],
          },
          html5: {
            nativeAudioTracks: true,
            nativeVideoTracks: true,
          },
          techOrder: ["html5"],
          userActions: {
            hotkeys: true,
          },
        });

        player.ready(() => {
          console.log("Video player is ready for lesson:", lessonId);
          setIsReady(true);
          setError(null);

          player.el().addEventListener("contextmenu", (e) => {
            e.preventDefault();
            return false;
          });

          if (videoElement) {
            videoElement.disablePictureInPicture = true;
            videoElement.setAttribute("disablePictureInPicture", "");
            videoElement.setAttribute("controlsList", "nodownload noremoteplayback");
            videoElement.oncontextmenu = () => false;
          }

          player.on("ended", () => {
            console.log("Video ended for lesson:", lessonId);
            onVideoEnd?.();
          });

          player.on("error", (e) => {
            const error = player.error();
            console.error("Video playback error:", error);
            if (error) {
              let errorMessage = errorMessages.loadError;

              switch (error.code) {
                case 1:
                  errorMessage = "تم إلغاء تحميل الفيديو";
                  break;
                case 2:
                  errorMessage = errorMessages.videoNotAvailable;
                  break;
                case 3:
                  errorMessage = "فشل فك تشفير الفيديو. يرجى تحديث المتصفح";
                  break;
                case 4:
                  errorMessage = errorMessages.formatNotSupported;
                  break;
                default:
                  if (error.message) {
                    errorMessage = error.message;
                  }
              }

              setError(errorMessage);
            }
          });

          player.on("playing", () => {
            console.log("Video is now playing successfully");
            setError(null);
          });

          player.on("loadedmetadata", () => {
            console.log("Video metadata loaded. Duration:", player.duration());
          });

          if (qualitySources && qualitySources.length > 1) {
            const qualities = qualitySources;
            const QualityButton = videojs.getComponent("MenuButton");
            const QualityOption = videojs.getComponent("MenuItem");

            class QualitySelectorButton extends QualityButton {
              constructor(player, options) {
                super(player, options);
                this.controlText(currentQuality || qualities[0]?.label || "Auto");
              }

              createEl() {
                const el = super.createEl("div", {
                  className: "vjs-quality-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button",
                });
                el.setAttribute("aria-label", t("lessons.videoPlayer.quality", "الجودة"));
                return el;
              }

              buildCSSClass() {
                return `vjs-quality-selector ${super.buildCSSClass()}`;
              }

              createItems() {
                return qualities.map((quality) => {
                  const item = new QualityOption(this.player_, {
                    label: quality.label,
                    selected: currentQuality === quality.label,
                  });

                  item.handleClick = () => {
                    const currentTime = this.player_.currentTime();
                    const wasPaused = this.player_.paused();
                    
                    this.player_.src({
                      src: quality.src,
                      type: quality.type || "video/mp4",
                    });
                    
                    this.player_.one("loadedmetadata", () => {
                      this.player_.currentTime(currentTime);
                      if (!wasPaused) {
                        this.player_.play();
                      }
                    });

                    setCurrentQuality(quality.label);
                    this.controlText(quality.label);
                    
                    console.log("Quality changed to:", quality.label);
                  };

                  return item;
                });
              }
            }

            videojs.registerComponent("QualitySelector", QualitySelectorButton);
            player.getChild("controlBar").addChild("QualitySelector", {}, 
              player.getChild("controlBar").children().length - 1
            );

            setCurrentQuality(qualities[0]?.label);
          }
        });

        let sourceType = "video/mp4";
        if (videoUrl.includes(".webm")) {
          sourceType = "video/webm";
        } else if (videoUrl.includes(".ogg") || videoUrl.includes(".ogv")) {
          sourceType = "video/ogg";
        } else if (videoUrl.includes(".mov")) {
          sourceType = "video/quicktime";
        }

        player.src({
          src: videoUrl,
          type: sourceType,
        });
        
        if (qualitySources && qualitySources.length > 0) {
          setCurrentQuality(qualitySources[0].label);
        } else {
          setCurrentQuality("Auto");
        }

        playerRef.current = player;

      } catch (err) {
        console.error("Error initializing video player:", err);
        setError("فشل تهيئة مشغل الفيديو");
      }
    };

    // Add a small initial delay to ensure DOM is fully ready
    initTimeoutRef.current = setTimeout(tryInitializePlayer, 100);

    return () => {
      retryCountRef.current = 0;

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      if (playerRef.current) {
        try {
          const player = playerRef.current;
          if (player && !player.isDisposed()) {
            player.dispose();
          }
        } catch (error) {
          console.error('Error disposing player:', error);
        } finally {
          playerRef.current = null;
        }
      }
    };
  }, [videoUrl, lessonId, onVideoEnd, user, t, qualitySources]);

  if (!videoUrl) {
    return (
      <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-xl" style={{ paddingTop: "56.25%" }}>
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

  if (error) {
    return (
      <div className="relative w-full bg-gradient-to-br from-red-900/30 to-gray-900 rounded-lg shadow-xl border border-red-500/20" style={{ paddingTop: "56.25%" }}>
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

  return (
    <div ref={containerRef} className="relative w-full video-container">
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white pointer-events-none">
        <FaShieldAlt />
        <span>{t("lessons.videoPlayer.protected", "محمي")}</span>
      </div>

      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-rose"
          playsInline
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <style>{`
        .video-container {
          position: relative;
          background: #000;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .video-container * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        :global(.vjs-theme-rose .vjs-big-play-button) {
          background-color: rgba(59, 130, 246, 0.9);
          border: none;
          border-radius: 50%;
        }

        :global(.vjs-theme-rose .vjs-big-play-button:hover) {
          background-color: rgba(37, 99, 235, 1);
        }

        :global(.vjs-theme-rose .vjs-control-bar) {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        }

        :global(.vjs-theme-rose .vjs-play-progress) {
          background-color: #3b82f6;
        }

        :global(.vjs-theme-rose .vjs-volume-level) {
          background-color: #3b82f6;
        }

        :global(.vjs-theme-rose .vjs-download-button) {
          display: none !important;
        }

        :global([dir="rtl"] .vjs-control-bar) {
          direction: ltr;
        }
      `}</style>
    </div>
  );
};

export default VideoJSPlayer;