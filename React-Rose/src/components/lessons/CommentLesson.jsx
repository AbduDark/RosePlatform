import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaCommentDots,
  FaUserCircle,
  FaPaperPlane,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import {
  getLessonComments,
  createComment,
  deleteComment,
} from "../../api/lessons";
import { useAuth } from "../../context/AuthContext";
import i18next from "i18next";

function CommentLesson({ lessonId }) {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ content: "" });

  useEffect(() => {
    const load = async () => {
      if (!lessonId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLessonComments(lessonId, token);
        setComments(data || []);
      } catch (e) {
        setError(e.message || t("lessons.comments.loadingComments", "حدث خطأ أثناء تحميل التعليقات"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [lessonId, token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(
        { lesson_id: Number(lessonId), content: form.content.trim() },
        token
      );
      setForm({ content: "" });
      const data = await getLessonComments(lessonId, token);
      setComments(data || []);
    } catch (e) {
      setError(e.message || t("lessons.comments.commentError", "حدث خطأ أثناء إضافة التعليق"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id, token);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FaCommentDots className="text-sm" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t("lessons.comments.title", "الأسئلة والنقاشات")}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
          {comments.length} تعليق
        </span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            {t("lessons.comments.addComment", "أضف سؤالك أو تعليقك على الدرس:")}
          </label>
          <textarea
            name="content"
            value={form.content}
            onChange={(e) => setForm({ content: e.target.value })}
            placeholder={t(
              "lessons.comments.addCommentPlaceholder",
              "اكتب سؤالك أو استفسارك هنا وستقوم المنصة والمدرس بالإجابة عليك..."
            )}
            rows={3}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !form.content.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isSubmitting || !form.content.trim()
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin text-xs" />
                <span>{t("lessons.comments.posting", "جاري النشر...")}</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="text-xs" />
                <span>{t("lessons.comments.postComment", "إرسال التعليق")}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments Feed */}
      <div className="pt-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-blue-400 text-xl" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs text-center">
            {error}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => {
              const isOwner = token && user?.id && comment.user?.id === user.id;

              return (
                <div
                  key={comment.id}
                  className="bg-slate-800/40 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center">
                          <FaUserCircle className="text-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-white">
                          {comment.user?.name || "مستخدم"}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-red-400 hover:text-red-300 p-1 text-xs transition-colors"
                            title="حذف التعليق"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-800/20 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
            {t("lessons.comments.noComments", "لا توجد تعليقات بعد. كن أول من يترك تعليقاً!")}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentLesson;
