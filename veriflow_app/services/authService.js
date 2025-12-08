import axios from 'axios';
import { Platform } from 'react-native';

// Small heuristic to pick a sensible API base during development.
// - web (expo "w") -> use hostname from window.location (keeps localhost or uses LAN IP when needed)
// - android emulator -> 10.0.2.2
// - ios simulator -> localhost
// Fallback to http://localhost:5001
const getApiBase = () => {
  // web (expo web)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || 'localhost';
    // keep explicit localhost as-is; otherwise use same host with port 5001
    return host === 'localhost' ? 'http://localhost:5001' : `http://${host}:5001`;
  }

  // react-native platforms (native/expo)
  try {
    if (Platform.OS === 'android') return 'http://10.0.2.2:5001';
    if (Platform.OS === 'ios') return 'http://localhost:5001';
  } catch (e) {
    // ignore
  }

  return 'http://localhost:5001';
};

const API_BASE = getApiBase();

const login = async (email, password) => {
  const url = `${API_BASE}/api/auth/login`;
  // returns the full response data (expects { user, token })
  const res = await axios.post(url, { email, password });
  return res.data;
};

const register = async (payload) => {
  const url = `${API_BASE}/api/auth/register`;
  // payload expected: { name, email, password, phone }
  const res = await axios.post(url, payload);
  return res.data;
};

export default { login, register };
