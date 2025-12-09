import { Platform } from 'react-native';

/**
 * API Configuration
 * Central location for all API endpoints
 */

// Your laptop/server IP address - update this when your IP changes
// Current IP: 10.1.30.65 (updates when network changes)
// Run './update-server-ip.sh' to automatically update this IP
const SERVER_IP = "10.1.30.65";
const SERVER_PORT = "5001";

/**
 * Get the appropriate API base URL based on platform
 */
const getApiBase = () => {
  // Web build (expo web)
  if (Platform.OS === 'web') {
    return `http://${SERVER_IP}:${SERVER_PORT}`;
  }

  // For Android physical devices, use the LAN IP address
  // For Android emulator, you would need to use http://10.0.2.2:5001 instead
  if (Platform.OS === 'android') {
    return `http://${SERVER_IP}:${SERVER_PORT}`;
  }

  // For iOS, you can use localhost if running on simulator
  // or the server IP if running on physical device
  if (Platform.OS === 'ios') {
    return `http://${SERVER_IP}:${SERVER_PORT}`;
  }

  // Default fallback
  return `http://${SERVER_IP}:${SERVER_PORT}`;
};

export const API_BASE = getApiBase();

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE}/api/auth/login`,
  REGISTER: `${API_BASE}/api/auth/register`,

  // Projects
  PROJECTS: `${API_BASE}/api/projects`,

  // Users
  FARMERS: `${API_BASE}/api/users/farmers`,
  MARKETPLACE_USERS: `${API_BASE}/api/users/marketplace-users`,
};

export default {
  API_BASE,
  API_ENDPOINTS,
};
