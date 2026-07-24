import { onRequest } from 'firebase-functions/v2/https';
import app from './app';
import { FirebaseService } from './infrastructure/firebase/firebase.service';

// Initialize Firebase Admin SDK for the backend
FirebaseService.init();

// Export the Express app as a Firebase HTTP Cloud Function
export const api = onRequest({ region: 'us-central1', cors: true }, app);
