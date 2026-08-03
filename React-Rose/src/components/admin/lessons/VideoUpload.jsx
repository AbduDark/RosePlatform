import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiUpload, FiTrash2, FiVideo, FiCheck, FiAlertCircle, FiClock, FiZap, FiLink, FiSettings } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { uploadLessonVideo, deleteLessonVideo, saveYouTubeVideoUrl, getVideoProcessingStatus } from "../../../api/lessons";
import { isValidYouTubeUrl } from "../../../utils/youtubeHelper";
import { useAuth } from "../../../context/AuthContext";

function VideoUpload({ lesson, onVideoUpdated, isOpen, onClose }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [activeSourceTab, setActiveSourceTab] = useState(lesson?.video_source === "youtube" ? "youtube" : "file");
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(lesson?.youtube_url || "");
  const [isSavingYoutube, setIsSavingYoutube] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const uploadStartTime = useRef(null);
  const uploadedBytes = useRef(0);
  const pollingTimer = useRef(null);

  const stopPolling = () => {
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  };

  const pollStatus = async (lessonId) => {
    try {
      const res = await getVideoProcessingStatus(lessonId, token);
      const data = res.data || res;
      if (data) {
        setProcessingProgress(data.progress || 50);
        setProcessingMessage(data.message || "جاري معالجة وتقليص الفيديو...");

        if (data.status === "ready") {
          stopPolling();
          setIsProcessing(false);
          setIsUploading(false);
          setSuccess("🎉 تم الرفع ومعالجة الفيديو بنجاح! الفيديو جاهز للمشاهدة الآن.");
          setSelectedVideo(null);
          setVideoPreview(null);
          if (onVideoUpdated) onVideoUpdated();
        } else if (data.status === "failed") {
          stopPolling();
          setIsProcessing(false);
          setIsUploading(false);
          setError("❌ فشل في معالجة الفيديو. يرجى إعادة المحاولة.");
        }
      }
    } catch (e) {
      console.error("Error polling video status:", e);
    }
  };

  const startPollingProcessing = (lessonId) => {
    stopPolling();
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingMessage("جاري بدء معالجة وتقليص الفيديو...");
    pollStatus(lessonId);
    pollingTimer.current = setInterval(() => {
      pollStatus(lessonId);
    }, 2500);
  };

  useEffect(() => {
    if (isOpen && lesson) {
      if (lesson.video_status === "processing") {
        startPollingProcessing(lesson.id);
      }
    }
    return () => stopPolling();
  }, [isOpen, lesson?.id]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    return formatFileSize(bytesPerSecond) + "/s";
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (file) => {
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError(t("videoUpload.invalidFileType", "يرجى اختيار ملف فيديو صالح"));
        return;
      }

      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      if (file.size > maxSize) {
        setError(t("videoUpload.fileTooLarge", "حجم الملف كبير جداً (الحد الأقصى 10 جيجابايت)"));
        return;
      }

      setSelectedVideo(file);
      setError("");
      setSuccess("");
      
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleVideoSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleVideoSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedVideo || !lesson || !token) return;

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);
    setUploadSpeed(0);
    setRemainingTime(null);
    uploadStartTime.current = Date.now();
    uploadedBytes.current = 0;

    try {
      await uploadLessonVideo(lesson.id, selectedVideo, token, (progress) => {
        const currentProgress = Math.round(progress);
        setUploadProgress(currentProgress);
        
        const now = Date.now();
        const elapsedSeconds = (now - uploadStartTime.current) / 1000;
        
        if (elapsedSeconds > 0 && progress > 0) {
          const currentBytes = (progress / 100) * selectedVideo.size;
          uploadedBytes.current = currentBytes;
          
          const speed = currentBytes / elapsedSeconds;
          setUploadSpeed(speed);
          
          if (speed > 0) {
            const remainingBytes = selectedVideo.size - currentBytes;
            const estimatedSeconds = remainingBytes / speed;
            setRemainingTime(estimatedSeconds);
          }
        }
      });

      // Upload completed 100% -> now transition to server processing phase
      setUploadProgress(100);
      startPollingProcessing(lesson.id);

    } catch (err) {
      setError(err.message);
      setUploadProgress(0);
      setUploadSpeed(0);
      setRemainingTime(null);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson || !token) return;

    const confirmed = window.confirm(t("videoUpload.deleteConfirm", "هل أنت متأكد من حذف الفيديو؟"));
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteLessonVideo(lesson.id, token);
      setSuccess(t("videoUpload.deleteSuccess", "تم حذف الفيديو بنجاح"));

      if (onVideoUpdated) {
        onVideoUpdated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveYoutubeUrl = async () => {
    if (!youtubeUrlInput || !lesson || !token) return;

    if (!isValidYouTubeUrl(youtubeUrlInput)) {
      setError("رابط اليوتيوب غير صحيح. يرجى التأكد من الرابط");
      return;
    }

    setIsSavingYoutube(true);
    setError("");
    setSuccess("");

    try {
      await saveYouTubeVideoUrl(lesson.id, youtubeUrlInput.trim(), token);
      setSuccess("تم حفظ رابط فيديو اليوتيوب بنجاح");
      if (onVideoUpdated) {
        onVideoUpdated();
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ رابط اليوتيوب");
    } finally {
      setIsSavingYoutube(false);
    }
  };

  const clearSelection = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl shadow-xl border border-gray-700 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FiVideo className="w-5 h-5" />
            {t("videoUpload.title", "إدارة فيديو الدرس")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isUploading || isDeleting}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Lesson Info */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2">{lesson.title}</h4>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>{t("videoUpload.lessonId", "رقم الدرس")}: {lesson.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              lesson.has_video 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {lesson.has_video 
                ? t("videoUpload.hasVideo", "يحتوي على فيديو") 
                : t("videoUpload.noVideo", "لا يحتوي على فيديو")
              }
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-300 flex items-center gap-2">
            <FiCheck className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Source Mode Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveSourceTab("file")}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeSourceTab === "file"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <FiUpload className="w-4 h-4" />
            رفع ملف فيديو مباشر
          </button>
          <button
            onClick={() => setActiveSourceTab("youtube")}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeSourceTab === "youtube"
                ? "border-red-500 text-red-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <FaYoutube className="w-4 h-4" />
            رابط يوتيوب (Unlisted/محمي)
          </button>
        </div>

        {/* Upload Section */}
        {activeSourceTab === "youtube" ? (
          <div className="space-y-4 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                <FiLink className="text-red-400" />
                أدخل رابط فيديو اليوتيوب (Unlisted):
              </label>
              <input
                type="url"
                value={youtubeUrlInput}
                onChange={(e) => setYoutubeUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 تلميح: ارفع الفيديو على قناتك بليوتيوب واجعله غير مدرج (Unlisted)، ثم انسخ الرابط وضعه هنا. النظام سيحميه ويمنع وصول الطلاب للرابط الأصلي.
              </p>
            </div>
            <button
              onClick={handleSaveYoutubeUrl}
              disabled={isSavingYoutube || !youtubeUrlInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSavingYoutube ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  حفظ رابط اليوتيوب
                </>
              )}
            </button>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && !isDeleting && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragging 
                ? "border-purple-500 bg-purple-500/10" 
                : "border-gray-600 hover:border-purple-500/50 bg-gray-700/50"
              }
              ${(isUploading || isDeleting) ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              disabled={isUploading || isDeleting}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full ${isDragging ? "bg-purple-500/20" : "bg-gray-600"}`}>
                <FiUpload className={`w-8 h-8 ${isDragging ? "text-purple-400" : "text-gray-300"}`} />
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  {t("videoUpload.dragDropText", "اسحب وأفلت الفيديو هنا")}
                </p>
                <p className="text-gray-400 text-sm">
                  {t("videoUpload.orClickText", "أو انقر لاختيار ملف")}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t("videoUpload.supportedFormats", "الصيغ المدعومة")}: MP4, WebM, AVI, MOV (Max: 500MB)
              </p>
            </div>
          </div>

          {/* Video Preview & Upload */}
          {selectedVideo && (
            <div className="p-4 bg-gray-700 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <FiVideo className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{selectedVideo.name}</p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(selectedVideo.size)} • {selectedVideo.type}
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelection();
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-48 object-contain"
                      />
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploading && !isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span className="flex items-center gap-1 font-medium">
                          <FiUpload className="w-4 h-4 text-purple-400 animate-bounce" />
                          {t("videoUpload.uploading", "جاري رفع الملف إلى السيرفر")}
                        </span>
                        <span className="font-bold text-purple-300">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiZap className="w-3 h-3 text-amber-400" />
                          {formatSpeed(uploadSpeed)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-blue-400" />
                          {formatTime(remainingTime)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Server Processing Progress Bar */}
                  {isProcessing && (
                    <div className="space-y-3 bg-purple-950/60 border border-purple-500/40 p-4 rounded-xl">
                      <div className="flex items-center justify-between text-sm text-purple-200">
                        <span className="flex items-center gap-2 font-medium">
                          <FiSettings className="w-4 h-4 animate-spin text-purple-400" />
                          {processingMessage || "جاري معالجة وتقليص الفيديو..."}
                        </span>
                        <span className="font-bold text-emerald-400 text-base">{processingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3.5 overflow-hidden border border-purple-500/20">
                        <div
                          className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 relative overflow-hidden"
                          style={{ width: `${processingProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-purple-300/80">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5 text-purple-400" />
                          يتم الضغط والتشفير في الخلفية لضمان سرعة التشغيل
                        </span>
                        <span className="text-amber-300 font-semibold animate-pulse">⚙️ معالجة نشطة</span>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {!isUploading && !isProcessing && (
                    <button
                      onClick={handleUpload}
                      disabled={isDeleting}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <FiUpload className="w-4 h-4" />
                      {t("videoUpload.uploadVideo", "رفع الفيديو")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Video Section */}
          {lesson.has_video && !selectedVideo && (
            <div className="pt-4 border-t border-gray-600">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex-1">
                  <h5 className="text-md font-medium text-white mb-1 flex items-center gap-2">
                    <FiTrash2 className="w-4 h-4" />
                    {t("videoUpload.deleteCurrentVideo", "حذف الفيديو الحالي")}
                  </h5>
                  <p className="text-gray-400 text-sm">
                    {t("videoUpload.deleteWarning", "سيتم حذف الفيديو نهائياً ولا يمكن التراجع عن هذا الإجراء")}
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={isUploading || isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg disabled:opacity-50 flex items-center gap-2 whitespace-nowrap transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("videoUpload.deleting", "جاري الحذف")}
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      {t("videoUpload.deleteVideo", "حذف الفيديو")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isUploading || isDeleting}
            className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {t("videoUpload.close", "إغلاق")}
          </button>
        </div>

        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

export default VideoUpload;
