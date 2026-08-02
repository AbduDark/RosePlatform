import { getDeviceIdentifier } from './deviceIdentifier';

// Check if token is valid by making a simple API call
export const validateToken = async (token) => {
  if (!token) return false;
  
  try {
    const API_BASE = import.meta.env.VITE_API_BASE;
    const deviceId = getDeviceIdentifier();
    
    const response = await fetch(`${API_BASE}/auth/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Create a fetch wrapper that handles unauthorized responses
export const createAuthenticatedFetch = (token, onUnauthorized) => {
  return async (url, options = {}) => {
    const deviceId = getDeviceIdentifier();
    
    // Add authorization header and device_id
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'X-Device-ID': deviceId,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle unauthorized (token invalid or session expired)
    if (response.status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    
    return response;
  };
};

// Intercept 401 responses globally
export const setupAuthInterceptor = (onSessionExpired) => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // Check if response is 401 Unauthorized
    if (response.status === 401) {
      const url = args[0];
      
      // Only trigger on API calls, not on login
      if (typeof url === 'string' && url.includes('/api/') && !url.includes('/auth/login')) {
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    }
    
    return response;
  };
};
