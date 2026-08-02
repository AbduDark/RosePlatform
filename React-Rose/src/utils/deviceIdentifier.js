// Generate a unique device identifier
export const getDeviceIdentifier = () => {
  // Check if device ID already exists in localStorage
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    // Generate a new unique device ID
    deviceId = generateUniqueId();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

// Generate unique ID based on browser fingerprint
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  
  // Collect browser information
  const browserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  
  // Create a hash-like string from browser info
  const infoString = Object.values(browserInfo).join('|');
  const hash = simpleHash(infoString);
  
  return `${timestamp}-${hash}-${randomStr}`;
};

// Simple hash function
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Get device information for display
export const getDeviceInfo = () => {
  const parser = navigator.userAgent;
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';
  
  // Detect browser
  if (parser.indexOf('Chrome') > -1) browserName = 'Chrome';
  else if (parser.indexOf('Safari') > -1) browserName = 'Safari';
  else if (parser.indexOf('Firefox') > -1) browserName = 'Firefox';
  else if (parser.indexOf('Edge') > -1) browserName = 'Edge';
  else if (parser.indexOf('Opera') > -1) browserName = 'Opera';
  
  // Detect OS
  if (parser.indexOf('Windows') > -1) osName = 'Windows';
  else if (parser.indexOf('Mac') > -1) osName = 'MacOS';
  else if (parser.indexOf('Linux') > -1) osName = 'Linux';
  else if (parser.indexOf('Android') > -1) osName = 'Android';
  else if (parser.indexOf('iOS') > -1) osName = 'iOS';
  
  return {
    browser: browserName,
    os: osName,
    device: /Mobile|Android|iPhone|iPad/.test(parser) ? 'Mobile' : 'Desktop'
  };
};
