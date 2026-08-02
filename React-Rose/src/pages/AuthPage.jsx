import { Routes, Route } from "react-router-dom";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import ForgotPassword from "../components/auth/ForgotPassword";
import VerifyEmail from "../components/auth/VerifyEmail";
import ResetPassword from "../components/auth/ResetPassword";

function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default AuthPage;