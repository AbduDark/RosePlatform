import React from "react";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function Pagination({ page, setPage, pageCount, totalItems, itemsPerPage }) {
  const { t } = useTranslation();

  // Ensure page and pageCount are valid numbers
  const currentPage = Math.max(1, parseInt(page) || 1);
  const totalPages = Math.max(1, parseInt(pageCount) || 1);

  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col items-center mt-8 space-y-4">
      {/* Page info */}
      {totalItems && itemsPerPage && (
        <div className="text-sm text-gray-400 text-center">
          {t("pagination.showing")} {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} {t("pagination.of")} {totalItems} {t("pagination.results")}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex justify-center" style={{ direction: "ltr" }}>
        <nav className="inline-flex rounded-md shadow bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600">
          <button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-l-md border-r border-gray-700 dark:border-gray-600 bg-gray-800 dark:bg-gray-900 text-gray-300 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t("pagination.previous")}
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          {visiblePages.map((pageNum, index) => (
            pageNum === '...' ? (
              <span
                key={`dots-${index}`}
                className="px-3 py-2 border-r border-gray-700 dark:border-gray-600 bg-gray-800 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 border-r border-gray-700 dark:border-gray-600 transition-colors ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 dark:bg-gray-900 text-gray-300 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700"
                }`}
                aria-label={`${t("pagination.page")} ${pageNum}`}
              >
                {pageNum}
              </button>
            )
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-r-md bg-gray-800 dark:bg-gray-900 text-gray-300 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t("pagination.next")}
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Pagination;