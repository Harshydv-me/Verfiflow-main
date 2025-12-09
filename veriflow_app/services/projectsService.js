import axios from 'axios';
import { API_BASE } from '../config/api';

export { API_BASE };

/**
 * ===== Project APIs =====
 */

// Create a new project
const createProject = async (token, payload) => {
  if (!token) throw new Error("Token is required to create a project");
  const url = `${API_BASE}/api/projects`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const res = await axios.post(url, payload, {
    headers,
    timeout: 60000 // 60 second timeout
  });
  return res.data;
};

// Fetch projects for a specific user
const getProjects = async (token, userId) => {
  if (!token) throw new Error("Token is required");
  if (!userId) throw new Error("userId is required");

  const url = `${API_BASE}/api/projects?owner=${userId}`;
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.projects ?? [];
};

// Fetch all projects (admin view)
const getAllProjects = async (token) => {
  if (!token) throw new Error("Token is required");
  const url = `${API_BASE}/api/projects`;
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.projects ?? [];
};

/**
 * ===== Image Upload API =====
 */
const uploadImage = async (projectId, token, file, metadata = {}) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!token) throw new Error("Token is required to upload image");
  if (!file?.uri) throw new Error("File URI is required");

  const form = new FormData();
  const uriParts = file.uri.split('/');
  const name = file.name || uriParts[uriParts.length - 1];

  // Detect file type
  let type = file.type;
  if (!type) {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    else if (ext === 'png') type = 'image/png';
    else if (ext === 'heic') type = 'image/heic';
    else type = 'application/octet-stream';
  }

  form.append('image', { uri: file.uri, name, type });

  // Optional metadata
  if (metadata.latitude) form.append("latitude", metadata.latitude);
  if (metadata.longitude) form.append("longitude", metadata.longitude);
  if (metadata.timestamp) form.append("timestamp", metadata.timestamp);

  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.post(`${API_BASE}/api/projects/${projectId}/images`, form, { headers });
  return res.data;
};

/* ===== Farmer APIs =====*/

// Fetch all farmers (admin)
const getAllFarmers = async (token) => {
  if (!token) throw new Error("Token is required to fetch farmers");
  const res = await axios.get(`${API_BASE}/api/users/farmers`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000 // 60 second timeout
  });
  return res.data.farmers ?? [];
};

/* ===== Marketplace User APIs =====*/

// Fetch all marketplace users (admin)
const getAllMarketplaceUsers = async (token) => {
  if (!token) throw new Error("Token is required to fetch marketplace users");
  const res = await axios.get(`${API_BASE}/api/users/marketplace-users`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000 // 60 second timeout
  });
  return res.data.users ?? [];
};

// Delete user by ID (admin)
const deleteUser = async (token, userId) => {
  if (!token) throw new Error("Token is required to delete user");
  if (!userId) throw new Error("User ID is required");
  const res = await axios.delete(`${API_BASE}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// Update user status (approve/reject farmer)
const updateUserStatus = async (token, userId, status) => {
  if (!token) throw new Error("Token is required to update user status");
  if (!userId) throw new Error("User ID is required");
  if (!status) throw new Error("Status is required");
  const res = await axios.patch(
    `${API_BASE}/api/users/${userId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Update user verification (marketplace users)
const updateUserVerification = async (token, userId, verificationStatus) => {
  if (!token) throw new Error("Token is required to update verification");
  if (!userId) throw new Error("User ID is required");
  if (!verificationStatus) throw new Error("Verification status is required");
  const res = await axios.patch(
    `${API_BASE}/api/users/${userId}/verification`,
    { verificationStatus },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

/**
 * ===== ML API Integration =====
 */

// ML API Configuration
// IMPORTANT: Update this URL with your actual Ngrok URL
// To get the URL:
// 1. Navigate to your ML backend folder (where api_server.py is located)
// 2. Run: python api_server.py (or uvicorn api_server:app)
// 3. In another terminal, run: ngrok http 8000
// 4. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
// 5. Replace YOUR_NGROK_URL below with that URL
const ML_API_BASE = "https://annabel-unperpetuated-unmythologically.ngrok-free.dev";

const getMLApiUrl = () => {
  // Return the full ML API endpoint URL
  return `${ML_API_BASE}/api/analyze`;
};

// Check if ML API is configured
const isMLApiConfigured = () => {
  return !ML_API_BASE.includes("YOUR_NGROK_URL");
};

// Run ML Analysis on a project
const runMLAnalysis = async (projectId, token, droneImageFile, startDate, endDate, manualHeight = 6.23) => {
  if (!isMLApiConfigured()) {
    throw new Error("ML API is not configured. Please update the Ngrok URL in projectsService.js");
  }

  const formData = new FormData();

  // Add drone image
  formData.append("image", droneImageFile);

  // Add parameters
  formData.append("start_date", startDate);
  formData.append("end_date", endDate);
  formData.append("manual_height", manualHeight.toString());

  const response = await axios.post(getMLApiUrl(), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for ML processing
  });

  return response.data;
};

// Save ML results to a project
const saveMLResults = async (projectId, token, mlResults) => {
  if (!projectId) throw new Error("Project ID is required");
  if (!token) throw new Error("Token is required");

  const response = await axios.patch(
    `${API_BASE}/api/projects/${projectId}`,
    {
      mlAnalysisResults: mlResults,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};

export default {
  API_BASE,
  createProject,
  getProjects,
  getAllProjects,
  uploadImage,
  getAllFarmers,
  getAllMarketplaceUsers,
  deleteUser,
  updateUserStatus,
  updateUserVerification,
  // ML API functions
  getMLApiUrl,
  isMLApiConfigured,
  runMLAnalysis,
  saveMLResults,
};
