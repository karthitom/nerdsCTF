import { IChallengeRepository, ChallengeDoc, HintDoc, Category, SubmissionDoc } from '../../domain/repositories/challenge.repository';
import { FirebaseService } from '../firebase/firebase.service';

// ── helpers ────────────────────────────────────────────────────────────────

async function fetchCategory(categoryId: string): Promise<Category> {
    const snap = await FirebaseService.db().collection('categories').doc(categoryId).get();
    if (!snap.exists) return { id: categoryId, name: 'Unknown' };
    const d = snap.data()!;
    return { id: snap.id, name: d.name, description: d.description };
}

async function fetchHints(challengeId: string): Promise<HintDoc[]> {
    const q = await FirebaseService.db()
        .collection('hints')
        .where('challengeId', '==', challengeId)
        .get();
    return q.docs.map((s) => ({
        id: s.id,
        challengeId: s.data().challengeId,
        content: s.data().content,
        costPoints: s.data().costPoints ?? 0,
    }));
}

function docToChallenge(snap: FirebaseFirestore.DocumentSnapshot): ChallengeDoc {
    const d = snap.data()!;
    return {
        id: snap.id,
        title: d.title,
        difficulty: d.difficulty,
        description: d.description,
        objectives: d.objectives,
        categoryId: d.categoryId,
        points: d.points,
        tags: d.tags,
        estimatedTime: d.estimatedTime,
        isActive: d.isActive ?? true,
        dockerImage: d.dockerImage,
        sourceCodeUrl: d.sourceCodeUrl,
        createdAt: d.createdAt?.toDate() ?? new Date(),
    };
}

// ── Repository ─────────────────────────────────────────────────────────────

export class ChallengeRepositoryImpl implements IChallengeRepository {
    private get db() {
        return FirebaseService.db();
    }

    async findById(id: string): Promise<(ChallengeDoc & { hints: HintDoc[] }) | null> {
        const snap = await this.db.collection('challenges').doc(id).get();
        if (!snap.exists) return null;
        const challenge = docToChallenge(snap);
        const hints = await fetchHints(id);
        return { ...challenge, hints };
    }

    async findAllActive(): Promise<(ChallengeDoc & { category: Category })[]> {
        const q = await this.db.collection('challenges').where('isActive', '==', true).get();
        return Promise.all(
            q.docs.map(async (snap) => {
                const challenge = docToChallenge(snap);
                const category = await fetchCategory(challenge.categoryId);
                return { ...challenge, category };
            })
        );
    }

    async findAllAdmin(): Promise<ChallengeDoc[]> {
        const q = await this.db.collection('challenges').get();
        return Promise.all(
            q.docs.map(async (snap) => {
                const challenge = docToChallenge(snap);
                const category = await fetchCategory(challenge.categoryId);
                return { ...challenge, category };
            })
        );
    }

    async create(data: any): Promise<ChallengeDoc> {
        const ref = this.db.collection('challenges').doc();
        const docData = { ...data, createdAt: new Date() };
        await ref.set(docData);
        return { id: ref.id, ...docData };
    }

    async update(id: string, data: any): Promise<ChallengeDoc> {
        await this.db.collection('challenges').doc(id).update(data);
        const snap = await this.db.collection('challenges').doc(id).get();
        return docToChallenge(snap);
    }

    async delete(id: string): Promise<ChallengeDoc> {
        const snap = await this.db.collection('challenges').doc(id).get();
        const challenge = docToChallenge(snap);
        await this.db.collection('challenges').doc(id).delete();
        return challenge;
    }

    async findFlagForChallenge(challengeId: string): Promise<string | null> {
        const q = await this.db
            .collection('flags')
            .where('challengeId', '==', challengeId)
            .limit(1)
            .get();
        if (q.empty) return null;
        return q.docs[0].data().flagHash ?? null;
    }

    async createSubmission(data: {
        userId: string;
        challengeId: string;
        submittedFlag: string;
        isCorrect: boolean;
    }): Promise<SubmissionDoc> {
        const ref = this.db.collection('submissions').doc();
        const submittedAt = new Date();
        await ref.set({ ...data, submittedAt });
        return { id: ref.id, ...data, submittedAt };
    }

    async hasSolved(userId: string, challengeId: string): Promise<boolean> {
        const q = await this.db
            .collection('submissions')
            .where('userId', '==', userId)
            .where('challengeId', '==', challengeId)
            .where('isCorrect', '==', true)
            .limit(1)
            .get();
        return !q.empty;
    }

    async countUserSolved(userId: string): Promise<number> {
        const q = await this.db
            .collection('submissions')
            .where('userId', '==', userId)
            .where('isCorrect', '==', true)
            .count()
            .get();
        return q.data().count;
    }

    async getUserPoints(userId: string): Promise<number> {
        const q = await this.db
            .collection('submissions')
            .where('userId', '==', userId)
            .where('isCorrect', '==', true)
            .get();

        let total = 0;
        await Promise.all(
            q.docs.map(async (sub) => {
                const challengeSnap = await this.db
                    .collection('challenges')
                    .doc(sub.data().challengeId)
                    .get();
                if (challengeSnap.exists) {
                    total += challengeSnap.data()!.points ?? 0;
                }
            })
        );
        return total;
    }

    async findHintById(hintId: string): Promise<HintDoc | null> {
        const snap = await this.db.collection('hints').doc(hintId).get();
        if (!snap.exists) return null;
        const d = snap.data()!;
        return {
            id: snap.id,
            challengeId: d.challengeId,
            content: d.content,
            costPoints: d.costPoints ?? 0,
        };
    }
}
