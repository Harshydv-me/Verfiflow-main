import axios from "axios";
import { API_BASE } from "../config/api";

// ------ AUTH SERVICES ------ //

const login = async (email, password) => {
  const url = `${API_BASE}/api/auth/login`;
  console.log('Login attempt to:', url);
  try {
    const res = await axios.post(url, { email, password }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Login successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      console.error('No response received - check network/server');
    }
    throw error;
  }
};

const register = async (payload) => {
  const url = `${API_BASE}/api/auth/register`;
  console.log('Register attempt to:', url);
  try {
    const res = await axios.post(url, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Registration successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      console.error('No response received - check network/server');
    }
    throw error;
  }
};

export default { login, register };