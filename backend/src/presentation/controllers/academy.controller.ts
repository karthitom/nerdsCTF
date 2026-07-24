import { Response } from 'express';
import { AcademyRepositoryImpl } from '../../infrastructure/repositories/academy.repository.impl';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const academyRepo = new AcademyRepositoryImpl();

function db() {
    return FirebaseService.db();
}

async function awardBadge(userId: string, badgeName: string) {
    const q = await db().collection('badges').where('name', '==', badgeName).limit(1).get();
    if (q.empty) return;
    const badgeId = q.docs[0].id;
    const docId = `${userId}_${badgeId}`;
    await db().collection('userBadges').doc(docId).set(
        { userId, badgeId, earnedAt: new Date() },
        { merge: true }
    );
}

export class AcademyController {
    static async getTopics(req: AuthenticatedRequest, res: Response) {
        try {
            const topics = await academyRepo.findAllTopics();
            return res.json({ success: true, topics });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to retrieve topics.' });
        }
    }

    static async getLesson(req: AuthenticatedRequest, res: Response) {
        const lessonId = req.params.id;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        try {
            const lesson = await academyRepo.findLessonById(lessonId);
            if (!lesson) {
                return res.status(404).json({ success: false, error: 'Lesson not found.' });
            }

            const progressDoc = await db()
                .collection('progress')
                .doc(`${req.user.userId}_${lessonId}`)
                .get();

            return res.json({
                success: true,
                lesson,
                completed: progressDoc.exists ? progressDoc.data()!.isCompleted : false,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to load lesson.' });
        }
    }

    static async completeLesson(req: AuthenticatedRequest, res: Response) {
        const { lessonId } = req.body;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        try {
            await academyRepo.saveProgress(req.user.userId, String(lessonId), true);

            await db().collection('auditLogs').add({
                userId: req.user.userId,
                action: 'ACADEMY_PROGRESS',
                details: `Completed lesson ID ${lessonId}`,
                ipAddress: req.ip,
                createdAt: new Date(),
            });

            // Check if user completed all lessons → award badge
            const totalLessonsQ = await db().collection('lessons').count().get();
            const completedQ = await db()
                .collection('progress')
                .where('userId', '==', req.user.userId)
                .where('isCompleted', '==', true)
                .count()
                .get();

            const totalLessons = totalLessonsQ.data().count;
            const completedLessons = completedQ.data().count;

            if (totalLessons > 0 && totalLessons === completedLessons) {
                await awardBadge(req.user.userId, 'Academy Scholar');
            }

            return res.json({ success: true, message: 'Progress saved successfully.' });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to save progress.' });
        }
    }

    static async submitQuiz(req: AuthenticatedRequest, res: Response) {
        const { quizId, selectedOption } = req.body;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        try {
            const quizSnap = await db().collection('quizzes').doc(String(quizId)).get();
            if (!quizSnap.exists) {
                return res.status(404).json({ success: false, error: 'Quiz question not found.' });
            }

            const quiz = quizSnap.data()!;
            const isCorrect = quiz.correctOption.trim() === selectedOption.trim();

            return res.json({
                success: true,
                correct: isCorrect,
                message: isCorrect ? 'Correct Option!' : 'Incorrect option. Review lesson and try again.',
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to process quiz.' });
        }
    }
}
