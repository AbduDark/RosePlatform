import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaYoutube } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import VideoProtection from "../common/VideoProtection";

const YouTubeSecurePlayer = ({ embedUrl, youtubeUrl, lessonTitle, lessonId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const rawUrl = embedUrl || youtubeUrl;

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("/embed/")) return url;
    
    // Extract video ID
    const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&showinfo=0&disablekb=0&fs=1&enablejsapi=1`;
    }
    return url;
  };

  const finalEmbedUrl = getEmbedUrl(rawUrl);

  if (!finalEmbedUrl) {
    return (
      <div className="relative w-full bg-slate-900 rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
        رابط اليوتيوب غير متوفر أو غير صحيح
      </div>
    );
  }

  return (
    <VideoProtection lessonId={lessonId} userId={user?.id}>
      <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group select-none">
        {/* Protected Badge */}
        <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 pointer-events-none">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-red-600/90 text-white shadow-lg backdrop-blur-sm">
            <FaYoutube className="w-4 h-4" />
            <FaShieldAlt className="w-3 h-3 ml-1" />
            <span>{t("lessons.videoPlayer.protected", "بث مشفر محمي")}</span>
          </div>
        </div>

        {/* Video Wrapper */}
        <div className="relative" style={{ paddingTop: "56.25%" }}>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          )}

          <iframe
            src={finalEmbedUrl}
            title={lessonTitle || "Lesson Video"}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={false}
            onLoad={() => setIframeLoaded(true)}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Top Bar Masking Overlay to block YouTube Title/Share link clicks */}
          <div 
            className="absolute top-0 left-0 right-0 h-14 z-20 bg-transparent pointer-events-auto cursor-default"
            onContextMenu={(e) => e.preventDefault()}
            title="Rose Academy Video Player"
          />

          {/* Bottom Right Logo Masking Overlay to block YouTube Logo redirect */}
          <div 
            className="absolute bottom-0 right-0 w-28 h-12 z-20 bg-transparent pointer-events-auto cursor-default"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Security Watermark floating */}
          {user && (
            <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-15 text-white text-xl font-bold rotate-[-25deg] whitespace-nowrap z-25">
              {user.name || user.email} • ID: {user.id}
            </div>
          )}
        </div>
      </div>
    </VideoProtection>
  );
};

export default YouTubeSecurePlayer;
