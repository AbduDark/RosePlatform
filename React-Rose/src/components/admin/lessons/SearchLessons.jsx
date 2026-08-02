import React from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";

function SearchLesson({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  selectedCourse,
  setSelectedCourse,
  courses = [],
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <FiSearch className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t("adminDashboard.searchLesson.searchPlaceholder")}
          className="w-full pl-12 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Free/Paid Filter */}
      <select
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
        className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">
          {t("adminDashboard.searchLesson.allLessons")}
        </option>
        <option value="free">
          {t("adminDashboard.searchLesson.freeLessons")}
        </option>
        <option value="paid">
          {t("adminDashboard.searchLesson.paidLessons")}
        </option>
      </select>

      {/* Course Filter */}
      <select
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
        className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">
          {t("adminDashboard.searchLesson.allCourses")}
        </option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchLesson;
