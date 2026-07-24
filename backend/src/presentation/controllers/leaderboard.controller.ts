import { Request, Response } from 'express';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

function db() {
    return FirebaseService.db();
}

export class LeaderboardController {
    static async getLeaderboard(req: Request, res: Response) {
        try {
            // Fetch all USER-role users
            const userRoleQ = await db().collection('roles').where('name', '==', 'USER').limit(1).get();
            const userRoleId = userRoleQ.empty ? null : userRoleQ.docs[0].id;

            if (!userRoleId) {
                return res.json({ success: true, leaderboard: [] });
            }

            const usersQ = await db().collection('users').where('roleId', '==', userRoleId).get();

            const rankings = await Promise.all(
                usersQ.docs.map(async (snap) => {
                    const d = snap.data();

                    // Fetch correct submissions for this user
                    const subQ = await db()
                        .collection('submissions')
                        .where('userId', '==', snap.id)
                        .where('isCorrect', '==', true)
                        .get();

                    // Sum up points by fetching each challenge's points
                    let totalPoints = 0;
                    await Promise.all(
                        subQ.docs.map(async (sub) => {
                            const challengeSnap = await db()
                                .collection('challenges')
                                .doc(sub.data().challengeId)
                                .get();
                            if (challengeSnap.exists) {
                                totalPoints += challengeSnap.data()!.points ?? 0;
                            }
                        })
                    );

                    const solvedCount = subQ.size;
                    const mockStreak = solvedCount > 0 ? Math.min(solvedCount * 2 - 1, 7) : 0;

                    return {
                        id: snap.id,
                        username: d.username,
                        country: d.country || 'N/A',
                        avatar: d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.username}`,
                        points: totalPoints,
                        solvedLabs: solvedCount,
                        streak: mockStreak,
                    };
                })
            );

            // Sort by points desc, then solvedLabs desc
            rankings.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.solvedLabs - a.solvedLabs;
            });

            return res.json({ success: true, leaderboard: rankings });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Failed to retrieve leaderboard data.' });
        }
    }
}
