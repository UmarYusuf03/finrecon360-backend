/**
 * API Configuration Constants
 * 
 * Centralized location for all API-related configuration.
 * This makes it easy to switch between mock data and real backend endpoints.
 * 
 * For production, these values should come from environment files.
 */

/**
 * Base URL for the ASP.NET Core backend API.
 */
export const API_BASE_URL = 'http://localhost:5000';

/**
 * API Endpoints for different modules in the FinRecon360 system.
 * Each endpoint is relative to the API_BASE_URL.
 */
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
    },

    DASHBOARD: {
        SUMMARY: '/api/dashboard/summary',
    },

    PROFILE: {
        ME: '/api/profile/me',
        CHANGE_PASSWORD: '/api/profile/me/change-password',
        DELETE: '/api/profile/me',
    },
} as const;

/**
 * HTTP request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * API versioning
 */
export const API_VERSION = 'v1';
