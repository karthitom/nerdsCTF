import { Request, Response } from 'express';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

function db() {
    return FirebaseService.db();
}

export class TicketController {
    static async createTicket(req: AuthenticatedRequest, res: Response) {
        const { title, description, priority } = req.body;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!title || !description) {
            return res.status(400).json({ success: false, error: 'Title and description are required.' });
        }

        try {
            const now = new Date();
            const ref = db().collection('supportTickets').doc();
            const ticketData = {
                userId: req.user.userId,
                title,
                description,
                priority: priority || 'LOW',
                status: 'OPEN',
                createdAt: now,
                updatedAt: now,
            };
            await ref.set(ticketData);

            await db().collection('auditLogs').add({
                userId: req.user.userId,
                action: 'CREATE_TICKET',
                details: `Created support ticket (${title})`,
                ipAddress: req.ip,
                createdAt: now,
            });

            return res.status(201).json({
                success: true,
                ticket: { id: ref.id, ...ticketData },
                message: 'Support ticket submitted successfully.',
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to create support ticket.' });
        }
    }

    static async getMyTickets(req: AuthenticatedRequest, res: Response) {
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        try {
            const q = await db()
                .collection('supportTickets')
                .where('userId', '==', req.user.userId)
                .orderBy('createdAt', 'desc')
                .get();

            const tickets = q.docs.map((snap) => ({
                id: snap.id,
                ...snap.data(),
                createdAt: snap.data().createdAt?.toDate(),
                updatedAt: snap.data().updatedAt?.toDate(),
            }));

            return res.json({ success: true, tickets });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to retrieve support tickets.' });
        }
    }

    static async submitFeedback(req: Request, res: Response) {
        const { name, email, messageType, feedbackText } = req.body;

        if (!name || !email || !messageType || !feedbackText) {
            return res.status(400).json({ success: false, error: 'All feedback fields must be specified.' });
        }

        try {
            const ref = db().collection('feedback').doc();
            const feedbackData = {
                name,
                email,
                messageType,
                feedbackText,
                createdAt: new Date(),
            };
            await ref.set(feedbackData);

            return res.status(201).json({
                success: true,
                feedback: { id: ref.id, ...feedbackData },
                message: 'Feedback received. Thank you for making nerdCTF better!',
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to record feedback.' });
        }
    }
}
