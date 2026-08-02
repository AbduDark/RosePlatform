import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import { ThemeProvider } from "../context/ThemeContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ScrollToTop from "./ScrollToTop";
import Loader from "../components/common/Loader";
import PageTransition from "../components/common/PageTransition";
import SessionExpiredModal from "../components/common/SessionExpiredModal";

const HomePage = lazy(() => import("../pages/HomePage"));
const CoursesPage = lazy(() => import("../pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("../pages/CourseDetailPage"));
const AuthPage = lazy(() => import("../pages/AuthPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const StudentDashboardPage = lazy(() => import("../pages/StudentDashboardPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const LessonPage = lazy(() => import("../pages/LessonPage"));
const ContactUsPage = lazy(() => import("../pages/ContactUsPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const TeamDeveloper = lazy(() => import("../pages/TeamDeveloperPage"));
const PrivateRoute = lazy(() => import("../router/PrivateRoute"));

function AnimatedRoutes() {
  const location = useLocation();
  const { sessionExpired } = useAuth();
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      setShowSessionModal(true);
    }
  }, [sessionExpired]);

  const handleCloseModal = () => {
    setShowSessionModal(false);
    window.location.href = '/auth/login';
  };

  const Layout = ({ children }) => (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <SessionExpiredModal 
        isOpen={showSessionModal} 
        onClose={handleCloseModal} 
      />
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Layout>
              <PageTransition>
                <HomePage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <PageTransition>
                <ContactUsPage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <PageTransition>
                <AboutPage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/developer"
          element={
            <Layout>
              <PageTransition>
                <TeamDeveloper />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/courses"
          element={
            <Layout>
              <PageTransition>
                <CoursesPage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <Layout>
              <PageTransition>
                <CourseDetailPage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/auth/*"
          element={
            <Layout>
              <PageTransition>
                <AuthPage />
              </PageTransition>
            </Layout>
          }
        />
        <Route
          path="/courses/:courseId/lessons/:lessonId?"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition>
                  <LessonPage />
                </PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/student-dashboard/:tab"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition>
                  <StudentDashboardPage />
                </PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition>
                  <NotificationsPage />
                </PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <PrivateRoute>
              <PageTransition>
                <AdminPage />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFoundPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppRoute() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={<Loader />}>
              <AnimatedRoutes />
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default AppRoute;
