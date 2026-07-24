import { Response } from 'express';
import * as crypto from 'crypto';
import { ChallengeRepositoryImpl } from '../../infrastructure/repositories/challenge.repository.impl';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Logger } from '../../infrastructure/logging/logger';

const challengeRepo = new ChallengeRepositoryImpl();

function db() {
    return FirebaseService.db();
}

async function writeAuditLog(userId: string, action: string, details: string, ipAddress?: string) {
    await db().collection('auditLogs').add({
        userId,
        action,
        details,
        ipAddress: ipAddress ?? null,
        createdAt: new Date(),
    });
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

export class ChallengeController {
    static async getChallenges(req: AuthenticatedRequest, res: Response) {
        if (!req.user) return res.status(401).json({ success: false, error: 'Context user missing' });

        try {
            const challenges = await challengeRepo.findAllActive();

            const mapped = await Promise.all(
                challenges.map(async (c) => {
                    const solved = await challengeRepo.hasSolved(req.user!.userId, c.id);
                    const hintsQ = await db()
                        .collection('hints')
                        .where('challengeId', '==', c.id)
                        .get();
                    const hints = hintsQ.docs.map((s) => ({
                        id: s.id,
                        costPoints: s.data().costPoints ?? 0,
                    }));

                    return {
                        id: c.id,
                        title: c.title,
                        difficulty: c.difficulty,
                        description: c.description,
                        objectives: c.objectives,
                        category: c.category.name,
                        points: c.points,
                        tags: c.tags.split(','),
                        estimatedTime: c.estimatedTime,
                        solved,
                        dockerImage: c.dockerImage,
                        hints,
                    };
                })
            );

            return res.json({ success: true, challenges: mapped });
        } catch (error: any) {
            Logger.error('Failed to load challenges', error.stack, 'ChallengeController');
            return res.status(500).json({ success: false, error: 'Failed to retrieve challenges.' });
        }
    }

    static async getHint(req: AuthenticatedRequest, res: Response) {
        const { challengeId, hintId } = req.body;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        try {
            const hint = await challengeRepo.findHintById(String(hintId));
            if (!hint || hint.challengeId !== String(challengeId)) {
                return res.status(404).json({ success: false, error: 'Hint not found.' });
            }

            const solved = await challengeRepo.hasSolved(req.user.userId, String(challengeId));
            if (!solved) {
                await writeAuditLog(
                    req.user.userId,
                    'UNLOCK_HINT',
                    `Unlocked hint ${hintId} for challenge ${challengeId}. Cost: ${hint.costPoints} points.`,
                    req.ip
                );
            }

            return res.json({ success: true, hint: hint.content });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Error unlocking hint.' });
        }
    }

    static async submitFlag(req: AuthenticatedRequest, res: Response) {
        const { challengeId, flag } = req.body;
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!flag) {
            return res.status(400).json({ success: false, error: 'Flag must be provided.' });
        }

        try {
            const alreadySolved = await challengeRepo.hasSolved(req.user.userId, String(challengeId));
            if (alreadySolved) {
                return res.status(400).json({ success: false, error: 'You have already solved this challenge!' });
            }

            const expectedHash = await challengeRepo.findFlagForChallenge(String(challengeId));
            if (!expectedHash) {
                return res.status(404).json({ success: false, error: 'Challenge flag config missing.' });
            }

            const inputHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');
            const isCorrect = inputHash === expectedHash;

            await challengeRepo.createSubmission({
                userId: req.user.userId,
                challengeId: String(challengeId),
                submittedFlag: flag.trim(),
                isCorrect,
            });

            await writeAuditLog(
                req.user.userId,
                isCorrect ? 'CHALLENGE_SOLVED' : 'CHALLENGE_ATTEMPT',
                isCorrect
                    ? `Solved challenge ID ${challengeId} correctly.`
                    : `Attempted challenge ID ${challengeId} with incorrect flag.`,
                req.ip
            );

            if (isCorrect) {
                const solvedCount = await challengeRepo.countUserSolved(req.user.userId);
                const currentScore = await challengeRepo.getUserPoints(req.user.userId);

                if (solvedCount === 1) await awardBadge(req.user.userId, 'First Blood');
                if (currentScore >= 500) await awardBadge(req.user.userId, 'Elite Hacker');

                return res.json({ success: true, correct: true, message: 'Correct Flag! Congratulations.' });
            } else {
                return res.json({
                    success: false,
                    correct: false,
                    message: 'Incorrect flag. Check your spelling or logical derivation and try again.',
                });
            }
        } catch (error: any) {
            Logger.error('Submit flag error', error.stack, 'ChallengeController');
            return res.status(500).json({ success: false, error: 'Verification pipeline error.' });
        }
    }
}
