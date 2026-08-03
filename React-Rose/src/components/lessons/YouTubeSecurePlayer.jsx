import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&showinfo=0&disablekb=0&fs=1&enablejsapi=1&iv_load_policy=3`;
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
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl group select-none border border-slate-800">
        {/* Video Wrapper */}
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-xs text-slate-400 font-medium">جاري تجهيز المشغل...</span>
              </div>
            </div>
          )}

          <iframe
            src={finalEmbedUrl}
            title={lessonTitle || "Lesson Video"}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen={true}
            onLoad={() => setIframeLoaded(true)}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Security Watermark floating cleanly over video */}
          {user && (
            <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-20 text-white text-sm sm:text-base font-bold rotate-[-20deg] whitespace-nowrap z-20 bg-slate-950/40 px-3 py-1 rounded-lg backdrop-blur-[2px] border border-white/10">
              {user.name || user.email} • ID: {user.id}
            </div>
          )}
        </div>
      </div>
    </VideoProtection>
  );
};

export default YouTubeSecurePlayer;
