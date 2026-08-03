import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaCommentDots,
  FaUserCircle,
  FaPaperPlane,
  FaSpinner,
  FaTrash,
  FaThumbsUp,
  FaReply,
  FaEdit,
  FaTimes,
  FaCheck
} from "react-icons/fa";
import {
  getLessonComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLikeComment
} from "../../api/comments";
import { useAuth } from "../../context/AuthContext";

function CommentLesson({ lessonId }) {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async () => {
    if (!lessonId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLessonComments(lessonId, token);
      const items = data?.data || data?.comments || (Array.isArray(data) ? data : []);
      setComments(items);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء تحميل التعليقات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [lessonId, token]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!content.trim() || !token) return;

    setIsSubmitting(true);
    try {
      await createComment(
        { lesson_id: Number(lessonId), content: content.trim() },
        token
      );
      setContent("");
      await loadComments();
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء إضافة التعليق");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyContent.trim() || !token) return;

    try {
      await createComment(
        { lesson_id: Number(lessonId), content: replyContent.trim(), parent_id: parentId },
        token
      );
      setReplyToId(null);
      setReplyContent("");
      await loadComments();
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء إضافة الرد");
    }
  };

  const handleEditSubmit = async (commentId) => {
    if (!editContent.trim() || !token) return;

    try {
      await updateComment(commentId, editContent.trim(), token);
      setEditingId(null);
      setEditContent("");
      await loadComments();
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء تعديل التعليق");
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await deleteComment(id, token);
      await loadComments();
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  const handleLike = async (commentId) => {
    if (!token) return;
    try {
      const res = await toggleLikeComment(commentId, token);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, is_liked: res.liked, likes_count: res.likes_count };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, is_liked: res.liked, likes_count: res.likes_count } : r
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Like error:", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
            <FaCommentDots className="text-base" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t("lessons.comments.title", "الأسئلة والتعليقات")}
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
          {comments.length} {t("lessons.comments.count", "تعليق")}
        </span>
      </div>

      {/* Comment Form */}
      {token ? (
        <form onSubmit={handleCreateComment} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              "lessons.comments.addCommentPlaceholder",
              "اكتب سؤالك أو تعليقك هنا..."
            )}
            rows={3}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSubmitting || !content.trim()
                  ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>جاري النشر...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" />
                  <span>إرسال التعليق</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm text-center">
          يرجى تسجيل الدخول لإضافة تعليق أو الاستفسار عن الدروس.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl text-red-600 dark:text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-primary text-2xl" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            const isAuthor = user?.id && comment.user?.id === user.id;
            const isAdmin = user?.role === "admin" || user?.is_admin;

            return (
              <div
                key={comment.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
              >
                {/* Main Comment Row */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {comment.user?.name ? comment.user.name[0].toUpperCase() : <FaUserCircle />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {comment.user?.name || "مستخدم"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString("ar-EG") : ""}
                      </span>
                    </div>

                    {editingId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          >
                            <FaTimes className="inline mr-1" /> إلغاء
                          </button>
                          <button
                            onClick={() => handleEditSubmit(comment.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-white"
                          >
                            <FaCheck className="inline mr-1" /> حفظ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-xs">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1.5 font-medium transition-colors ${
                          comment.is_liked
                            ? "text-primary font-bold"
                            : "text-gray-500 dark:text-gray-400 hover:text-primary"
                        }`}
                      >
                        <FaThumbsUp className="text-xs" />
                        <span>{comment.likes_count || 0}</span>
                      </button>

                      {token && (
                        <button
                          onClick={() => {
                            setReplyToId(replyToId === comment.id ? null : comment.id);
                            setReplyContent("");
                          }}
                          className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                        >
                          <FaReply className="text-xs" />
                          <span>رد</span>
                        </button>
                      )}

                      {(isAuthor || isAdmin) && (
                        <>
                          {isAuthor && (
                            <button
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditContent(comment.content);
                              }}
                              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="حذف"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Reply Form */}
                {replyToId === comment.id && (
                  <div className="mr-12 mt-2 space-y-2 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="اكتب ردك هنا..."
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setReplyToId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-white"
                      >
                        إرسال الرد
                      </button>
                    </div>
                  </div>
                )}

                {/* Threaded Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mr-10 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor = user?.id && reply.user?.id === user.id;

                      return (
                        <div
                          key={reply.id}
                          className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg flex items-start gap-3 border border-gray-100 dark:border-gray-700/40"
                        >
                          <div className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {reply.user?.name ? reply.user.name[0].toUpperCase() : <FaUserCircle />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                {reply.user?.name || "مستخدم"}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {reply.created_at ? new Date(reply.created_at).toLocaleDateString("ar-EG") : ""}
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                              {reply.content}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[11px]">
                              <button
                                onClick={() => handleLike(reply.id)}
                                className={`flex items-center gap-1 font-medium ${
                                  reply.is_liked ? "text-primary font-bold" : "text-gray-400 hover:text-primary"
                                }`}
                              >
                                <FaThumbsUp className="text-[10px]" />
                                <span>{reply.likes_count || 0}</span>
                              </button>

                              {(isReplyAuthor || isAdmin) && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <FaTrash className="text-[10px]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs">
            لا توجد تعليقات بعد. كن أول من يترك تعليقاً!
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentLesson;
