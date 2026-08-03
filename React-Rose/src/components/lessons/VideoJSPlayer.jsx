import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiRotateCcw,
  FiShield,
  FiSettings,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const VideoJSPlayer = ({ videoUrl, lessonId, lessonTitle, onVideoEnd }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls after 3 seconds of inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    let hls = null;

    // Clean up previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = videoUrl.includes(".m3u8") || videoUrl.includes("/stream");

    if (isHls && Hls.isSupported()) {
      console.log("🎬 initializing hls.js player for video:", videoUrl);
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("Fatal HLS Error:", data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, attempting HLS reload...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, attempting HLS recovery...");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError(
                t("lessons.videoPlayer.loadError", "فشل تحميل الفيديو. يرجى إعادة محاولة التحميل.")
              );
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (e.g. Safari)
      video.src = videoUrl;
    } else {
      // Standard video URL fallback
      video.src = videoUrl;
    }

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / (video.duration || 1)) * 100);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd();
    };

    const onError = (e) => {
      // Ignore native video errors if HLS is actively managing media
      if (hlsRef.current) return;
      console.error("Video Error:", e, video.error);
      setIsLoading(false);
      setError(
        video.error?.message ||
        t("lessons.videoPlayer.loadError", "فشل تحميل الفيديو. يرجى إعادة محاولة التحميل.")
      );
    };

    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [videoUrl, lessonId, onVideoEnd, t]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Play error:", err);
          setError("لم يتم التمكن من تشغيل الفيديو تلقائياً");
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!videoUrl) {
    return (
      <div
        className="relative w-full bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center p-8 text-center"
        style={{ minHeight: "380px" }}
      >
        <div className="text-slate-400">
          <FiShield className="w-16 h-16 mx-auto mb-4 opacity-40 text-purple-400" />
          <h3 className="text-xl font-bold text-white mb-2">لم يتم رفع الفيديو الخاص بهذا الدرس بعد</h3>
          <p className="text-sm">يرجى مراجعة المحاضر لتأكيد رفع ملف الفيديو</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl group border border-slate-800/80 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        style={{ minHeight: "380px", maxHeight: isFullscreen ? "100vh" : "70vh" }}
        onClick={togglePlay}
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Floating Watermark Protection */}
      {user && (
        <div className="absolute top-4 right-4 pointer-events-none z-20 opacity-30 text-[11px] text-white font-mono bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          {user.name} • {user.phone || user.email}
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-40 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
            <FiShield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">خطأ في تحميل الفيديو</h3>
          <p className="text-sm text-slate-400 max-w-md mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <FiRotateCcw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Big Play Button Overlay */}
      {!isPlaying && !isLoading && !error && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-20 hover:bg-black/20 transition-all"
        >
          <div className="w-20 h-20 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 hover:scale-110 transition-transform border border-purple-400/40">
            <FiPlay className="w-9 h-9 translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Custom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Progress Seek Bar */}
        <div className="relative w-full mb-3 group/timeline cursor-pointer">
          {/* Buffer Track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-slate-700 rounded-full pointer-events-none transition-all"
            style={{ width: `${buffered}%` }}
          />
          {/* Active Track */}
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500 hover:h-2.5 transition-all"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left Controls: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-slate-200 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="text-slate-200 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                {isMuted || volume === 0 ? (
                  <FiVolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <FiVolume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Time Counter */}
            <div className="text-xs font-mono text-slate-300">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-slate-500">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Title, Playback Rate, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Speed Rate Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-purple-400 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                <FiSettings className="w-3.5 h-3.5" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 w-24 z-50 text-xs">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`w-full text-right px-3 py-1.5 hover:bg-purple-600/30 transition-colors flex items-center justify-between ${playbackRate === rate ? "text-purple-400 font-bold bg-purple-500/10" : "text-slate-300"
                        }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-slate-200 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoJSPlayer;