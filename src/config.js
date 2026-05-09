// config.js — one place to manage API URLs
// In development → localhost:5000
// In production  → your Render server URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export default BASE_URL