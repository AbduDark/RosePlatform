import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

const SessionExpiredModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            تم تسجيل الدخول من جهاز آخر
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            تم تسجيل الدخول إلى حسابك من جهاز آخر. للحفاظ على أمان حسابك، تم تسجيل خروجك من هذا الجهاز.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>ملاحظة:</strong> يمكنك تسجيل الدخول من جهاز واحد فقط في نفس الوقت
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            تسجيل الدخول مرة أخرى
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
