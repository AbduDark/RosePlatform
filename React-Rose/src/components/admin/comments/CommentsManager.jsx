import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiMessageSquare, FiCheck, FiTrash2, FiClock, FiUser, FiBookOpen } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import Loader from "../../common/Loader";

const CommentsManager = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [pendingComments, setPendingComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchPendingComments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/admin/comments/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("فشل جلب التعليقات المعلقة");
      }

      const data = await response.json();
      setPendingComments(data.data || data.comments || data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err.message || "حدث خطأ أثناء تحميل التعليقات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingComments();
  }, [token]);

  const handleApprove = async (commentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/admin/comments/${commentId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("فشل الموفقة على التعليق");
      }

      setActionSuccess("تمت الموافقة على التعليق بنجاح");
      setPendingComments(prev => prev.filter(c => c.id !== commentId));
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("فشل حذف التعليق");
      }

      setActionSuccess("تم حذف التعليق بنجاح");
      setPendingComments(prev => prev.filter(c => c.id !== commentId));
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiMessageSquare className="text-blue-400" />
            إدارة التعليقات المعلقة
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            مراجعة واستعراض التعليقات المنتظرة للموافقة عليها أو حذفها
          </p>
        </div>
        <span className="bg-blue-900/50 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-sm font-semibold">
          المعلق: {pendingComments.length}
        </span>
      </div>

      {actionSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {pendingComments.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <FiMessageSquare className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">لا توجد تعليقات معلقة حالياً</h3>
          <p className="text-gray-500 text-sm">جميع التعليقات تمت مراجعتها وموافق عليها</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1 text-blue-400 font-medium">
                      <FiUser /> {comment.user?.name || `مستخدم #${comment.user_id}`}
                    </span>
                    {comment.lesson && (
                      <span className="flex items-center gap-1 text-purple-400">
                        <FiBookOpen /> {comment.lesson.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-500">
                      <FiClock /> {new Date(comment.created_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    {comment.content || comment.text}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleApprove(comment.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow"
                  >
                    <FiCheck /> موافقة
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow"
                  >
                    <FiTrash2 /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsManager;
