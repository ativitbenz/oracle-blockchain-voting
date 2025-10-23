/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Get API base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Export configuration object
export default {
  API_BASE_URL,
};
