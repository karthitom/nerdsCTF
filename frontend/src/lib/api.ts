import axios from 'axios';

// Since we moved the backend to Next.js API Routes + Supabase, 
// we just point the Axios client to the internal Next.js routes.
const API_URL = '/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// We no longer need the complex token refresh interceptor because 
// Supabase SSR handles the cookie tokens automatically through Next.js middleware!
