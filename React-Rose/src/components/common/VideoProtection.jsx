import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SECURITY_CONFIG } from "../../config/security";

/**
 * مكون حماية الفيديو المتقدم
 * يمنع التحميل غير المصرح به والوصول غير المشروع
 */
const VideoProtection = ({
  children,
  lessonId,
  userId,
  onSecurityViolation,
}) => {
  const { t } = useTranslation();
  const protectionRef = useRef(null);
  const violationCountRef = useRef(0);
  const maxViolations = SECURITY_CONFIG.TOKENS.MAX_VIOLATIONS;

  useEffect(() => {
    const protectionElement = protectionRef.current;
    if (!protectionElement) return;

    // منع النقر بالزر الأيمن
    const handleContextMenu = (e) => {
      e.preventDefault();
      violationCountRef.current++;
      if (violationCountRef.current >= maxViolations) {
        onSecurityViolation?.("context_menu_abuse");
      }
      return false;
    };

    // منع اختصارات لوحة المفاتيح
    const handleKeyDown = (e) => {
      const forbiddenKeys = SECURITY_CONFIG.FORBIDDEN_KEYBOARD_SHORTCUTS;

      const isForbidden = forbiddenKeys.some((forbidden) => {
        if (forbidden.key && e.key === forbidden.key) {
          if (forbidden.ctrl && !e.ctrlKey) return false;
          if (forbidden.shift && !e.shiftKey) return false;
          return true;
        }
        return false;
      });

      if (isForbidden) {
        e.preventDefault();
        e.stopPropagation();
        violationCountRef.current++;
        if (violationCountRef.current >= maxViolations) {
          onSecurityViolation?.("keyboard_shortcut_abuse");
        }
        return false;
      }
    };

    // منع السحب والإفلات
    const handleDragStart = (e) => {
      e.preventDefault();
      violationCountRef.current++;
      if (violationCountRef.current >= maxViolations) {
        onSecurityViolation?.("drag_drop_attempt");
      }
      return false;
    };

    // منع اختيار النص
    const handleSelectStart = (e) => {
      e.preventDefault();
      violationCountRef.current++;
      if (violationCountRef.current >= maxViolations) {
        onSecurityViolation?.("text_selection_attempt");
      }
      return false;
    };

    // منع نسخ الصور
    const handleCopy = (e) => {
      e.preventDefault();
      violationCountRef.current++;
      if (violationCountRef.current >= maxViolations) {
        onSecurityViolation?.("copy_attempt");
      }
      return false;
    };

    // منع الطباعة
    const handlePrint = (e) => {
      e.preventDefault();
      violationCountRef.current++;
      if (violationCountRef.current >= maxViolations) {
        onSecurityViolation?.("print_attempt");
      }
      return false;
    };

    // مراقبة تغييرات DOM المشبوهة
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            // فقط منع إضافة روابط التحميل المباشرة خارج نطاق الحماية
            if (element.tagName === "A" && element.href && !protectionElement.contains(element)) {
              if (
                element.href.includes("download") ||
                element.download
              ) {
                element.remove();
                violationCountRef.current++;
                if (violationCountRef.current >= maxViolations) {
                  onSecurityViolation?.("download_link_injection");
                }
              }
            }
            // منع إضافة عناصر مشبوهة خارج نطاق الحماية فقط
            if ((element.tagName === "SCRIPT" || element.tagName === "IFRAME") && !protectionElement.contains(element)) {
              element.remove();
              violationCountRef.current++;
              if (violationCountRef.current >= maxViolations) {
                onSecurityViolation?.("script_injection");
              }
            }
          }
        });
      });
    });

    // مراقبة محاولات فتح أدوات المطور (مع تسامح أكبر للمتصفحات المختلفة)
    const devToolsCheck = setInterval(() => {
      // زيادة الحد الأدنى لتجنب False Positives في المتصفحات المختلفة
      if (
        window.outerHeight - window.innerHeight > 300 ||
        window.outerWidth - window.innerWidth > 300
      ) {
        violationCountRef.current++;
        if (violationCountRef.current >= maxViolations) {
          onSecurityViolation?.("dev_tools_opened");
        }
      }
    }, 2000);

    // إضافة مستمعي الأحداث
    protectionElement.addEventListener("contextmenu", handleContextMenu);
    protectionElement.addEventListener("keydown", handleKeyDown);
    protectionElement.addEventListener("dragstart", handleDragStart);
    protectionElement.addEventListener("selectstart", handleSelectStart);
    protectionElement.addEventListener("copy", handleCopy);
    protectionElement.addEventListener("beforeprint", handlePrint);

    // بدء مراقبة DOM فقط على عنصر الحماية لتجنب التداخل
    observer.observe(protectionElement, {
      childList: true,
      subtree: true,
    });

    // تنظيف
    return () => {
      protectionElement.removeEventListener("contextmenu", handleContextMenu);
      protectionElement.removeEventListener("keydown", handleKeyDown);
      protectionElement.removeEventListener("dragstart", handleDragStart);
      protectionElement.removeEventListener("selectstart", handleSelectStart);
      protectionElement.removeEventListener("copy", handleCopy);
      protectionElement.removeEventListener("beforeprint", handlePrint);
      observer.disconnect();
      clearInterval(devToolsCheck);
    };
  }, [lessonId, userId, onSecurityViolation]);

  return (
    <div
      ref={protectionRef}
      className="relative w-full h-full"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        border: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onBeforePrint={(e) => e.preventDefault()}
    >
      {children}

      {/* طبقة حماية شفافة */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "transparent",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      />
    </div>
  );
};

export default VideoProtection;
