import React, { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../../api/auth";
import { useTranslation } from "react-i18next";
import studyImage from "../../assets/images/study.svg";

function Register() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    passwordsMatch: false,
  });

  const isRTL = i18n.dir() === 'rtl';

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number - only allow numbers and limit to 11 digits
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData({
        ...formData,
        [name]: numericValue,
      });
      if (error) setError("");
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError("");

    // Real-time password validation
    if (name === "password") {
      setPasswordValidation({
        minLength: value.length >= 8 && /^[a-zA-Z0-9]+$/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        passwordsMatch: value === formData.password_confirmation && value !== "",
      });
    }
    
    // Check password confirmation match
    if (name === "password_confirmation") {
      setPasswordValidation(prev => ({
        ...prev,
        passwordsMatch: value === formData.password && value !== "",
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t("auth.register.validation.fullNameRequired"));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t("auth.register.validation.emailRequired"));
      return false;
    }
    if (!formData.email.includes("@")) {
      setError(t("auth.register.validation.validEmail"));
      return false;
    }
    if (!formData.phone || formData.phone.length !== 11) {
      setError("رقم الهاتف يجب أن يتكون من 11 رقم");
      return false;
    }
    if (!formData.phone.startsWith("01")) {
      setError("رقم الهاتف يجب أن يبدأ بـ 01");
      return false;
    }
    if (!formData.password) {
      setError(t("auth.register.validation.passwordRequired"));
      return false;
    }
    if (formData.password.length < 8 || !/^[a-zA-Z0-9]+$/.test(formData.password)) {
      setError("Password must be at least 8 characters and contain only letters and numbers");
      return false;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      setError(t("auth.register.validation.passwordsNotMatch"));
      return false;
    }
    if (!formData.gender) {
      setError(t("auth.register.validation.genderRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/2">
            <div className="max-w-[480px] mx-auto p-10 rounded-2xl bg-white dark:bg-gray-700 shadow-2xl border border-gray-200 dark:border-gray-600">
              <div className="w-full text-center">
                <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                  <div className="text-green-600 dark:text-green-400 text-5xl">✓</div>
                </div>
                <header className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                  {t("auth.register.success.title")}
                </header>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {t("auth.register.success.description")}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                  {t("auth.register.success.note")}
                </div>
                <Link
                  to="/auth/login"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {t("auth.register.success.goToLogin")}
                </Link>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
              <img 
                src={studyImage} 
                alt="Registration illustration" 
                className="relative w-full max-w-lg h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-full lg:w-1/2">
          <div className="w-full max-w-[480px] mx-auto p-10 rounded-2xl bg-white dark:bg-gray-700 shadow-2xl border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-3xl">
            <div className="w-full">
              <header className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-2">
                {t("auth.register.title")}
              </header>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                {t("auth.register.alreadyHaveAccount")}{" "}
                <Link
                  to="/auth/login"
                  className="text-primary dark:text-primary font-semibold hover:underline"
                >
                  {t("auth.register.login")}
                </Link>
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("auth.register.fullName")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("auth.register.email")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setShowPasswordValidation(true)}
                    onBlur={() => setShowPasswordValidation(false)}
                    placeholder={t("auth.register.createPassword")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                    required
                  />
                  <i 
                    className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} transform -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400 cursor-pointer p-1 hover:text-primary transition-colors`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                {formData.password && showPasswordValidation && (
                  <div className="space-y-2 text-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <i className="bx bx-check-shield text-primary text-lg"></i>
                      {t("auth.register.passwordRequirements")}
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${passwordValidation.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="text-base">{passwordValidation.minLength ? '✅' : '○'}</span>
                      <span>{t("auth.register.minLength")}</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${passwordValidation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="text-base">{passwordValidation.hasLowercase ? '✅' : '○'}</span>
                      <span>{t("auth.register.hasLowercase")}</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${passwordValidation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="text-base">{passwordValidation.hasUppercase ? '✅' : '○'}</span>
                      <span>{t("auth.register.hasUppercase")}</span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder={t("auth.register.confirmPassword")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                    required
                  />
                  <i 
                    className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'} absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} transform -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400 cursor-pointer p-1 hover:text-primary transition-colors`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  ></i>
                </div>

                {formData.password_confirmation && (
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${passwordValidation.passwordsMatch ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
                    <span className="text-base">{passwordValidation.passwordsMatch ? '✅' : '✗'}</span>
                    <span className="font-medium">{passwordValidation.passwordsMatch ? t("auth.register.passwordsMatch") : t("auth.register.passwordsDoNotMatch")}</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    maxLength="11"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                    required
                  />
                  {formData.phone && formData.phone.length === 11 && formData.phone.startsWith("01") && (
                    <p className="mt-1 text-sm text-green-500 dark:text-green-400 flex items-center gap-1">
                      ✓ رقم صحيح
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 px-2">
                  <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                    {t("auth.register.gender")}:
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleChange}
                        className="accent-primary w-4 h-4"
                        required
                      />
                      <span>{t("auth.register.male")}</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleChange}
                        className="accent-primary w-4 h-4"
                        required
                      />
                      <span>{t("auth.register.female")}</span>
                    </label>
                  </div>
                </div>

                <div className="relative pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`h-12 w-full border-none text-base font-semibold rounded-lg text-white transition-all duration-300 ease-in-out ${
                      loading
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {loading
                      ? t("auth.register.creatingAccount")
                      : t("auth.register.signupButton")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
            <img 
              src={studyImage} 
              alt="Registration illustration" 
              className="relative w-full max-w-lg h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
