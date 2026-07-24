import * as admin from 'firebase-admin';
import { Logger } from '../logging/logger';

export class FirebaseService {
    private static instance: admin.app.App | null = null;

    static init(): void {
        if (this.instance) return;

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error(
                'Firebase credentials are required. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in your .env file.'
            );
        }

        this.instance = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        Logger.info('Firebase Admin SDK initialized successfully.', 'FirebaseService');
    }

    static getApp(): admin.app.App {
        if (!this.instance) {
            throw new Error('FirebaseService has not been initialized. Call FirebaseService.init() first.');
        }
        return this.instance;
    }

    static getAuth(): admin.auth.Auth {
        return this.getApp().auth();
    }

    /** Primary Firestore database access */
    static db(): FirebaseFirestore.Firestore {
        return this.getApp().firestore();
    }

    static isInitialized(): boolean {
        return this.instance !== null;
    }
}
