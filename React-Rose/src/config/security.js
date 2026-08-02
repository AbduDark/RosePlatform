/**
 * تكوينات الأمان للفيديو
 * Video Security Configuration
 */
export const SECURITY_CONFIG = {
  // Token configurations
  TOKENS: {
    MAX_VIOLATIONS: 5, // Maximum allowed security violations
  },

  // Forbidden keyboard shortcuts
  FORBIDDEN_KEYBOARD_SHORTCUTS: [
    { key: "F12", ctrl: false }, // Dev tools
    { key: "I", ctrl: true, shift: true }, // Inspect
    { key: "J", ctrl: true, shift: true }, // Console
    { key: "C", ctrl: true, shift: true }, // Inspect element
    { key: "U", ctrl: true }, // View source
    { key: "S", ctrl: true }, // Save
    { key: "P", ctrl: true }, // Print
  ],
};
