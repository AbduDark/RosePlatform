import React, { createContext, useContext, useState, useEffect } from "react";
import { getCourses, getCourseById } from "../api/courses";

const CourseContext = createContext();

export const useCourse = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchCourses = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCourses(pageNum);

      setCourses(Array.isArray(response.data) ? response.data : []);
      setMeta(response.meta || null);
      setPage(response.meta?.current_page || 1);
    } catch (err) {
      setError(err.message);
      setCourses([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      return await getCourseById(id);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(page);
  }, [page]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        loading,
        error,
        fetchCourses,
        fetchCourseById,
        page,
        setPage,
        meta,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
