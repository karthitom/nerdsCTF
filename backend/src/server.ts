import dotenv from 'dotenv';
import app from './app';
import { Logger } from './infrastructure/logging/logger';
import { FirebaseService } from './infrastructure/firebase/firebase.service';

// Load environment variables first
dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
    try {
        // Initialize Firebase Admin SDK (Firestore + Auth)
        FirebaseService.init();

        // Verify Firestore connectivity with a lightweight probe
        await FirebaseService.db().collection('_health').doc('ping').set({
            checkedAt: new Date(),
        });
        Logger.info('Firestore connection verified.', 'ServerBootstrap');

        // Start HTTP listener
        app.listen(PORT, () => {
            Logger.info(
                `nerdCTF Engine running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
                'ServerBootstrap'
            );
        });
    } catch (err: any) {
        Logger.error('Critical boot failure. nerdCTF server shutting down.', err.stack, 'ServerBootstrap');
        process.exit(1);
    }
}

bootstrap();
