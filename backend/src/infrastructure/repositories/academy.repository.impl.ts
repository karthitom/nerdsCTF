import { IAcademyRepository, AcademyTopicDoc, LessonDoc, ProgressDoc, QuizDoc } from '../../domain/repositories/academy.repository';
import { FirebaseService } from '../firebase/firebase.service';

// ── helpers ────────────────────────────────────────────────────────────────

async function fetchLessonSummariesForTopic(topicId: string) {
    const q = await FirebaseService.db()
        .collection('lessons')
        .where('topicId', '==', topicId)
        .orderBy('orderIndex', 'asc')
        .get();
    return q.docs.map((s) => ({
        id: s.id,
        title: s.data().title,
        orderIndex: s.data().orderIndex,
    }));
}

async function fetchQuizzesForLesson(lessonId: string): Promise<QuizDoc[]> {
    const q = await FirebaseService.db()
        .collection('quizzes')
        .where('lessonId', '==', lessonId)
        .get();
    return q.docs.map((s) => ({
        id: s.id,
        lessonId: s.data().lessonId,
        question: s.data().question,
        optionsJson: s.data().optionsJson,
        correctOption: s.data().correctOption,
    }));
}

// ── Repository ─────────────────────────────────────────────────────────────

export class AcademyRepositoryImpl implements IAcademyRepository {
    private get db() {
        return FirebaseService.db();
    }

    async findAllTopics(): Promise<AcademyTopicDoc[]> {
        const q = await this.db
            .collection('academyTopics')
            .orderBy('orderIndex', 'asc')
            .get();

        return Promise.all(
            q.docs.map(async (snap) => {
                const d = snap.data();
                const lessons = await fetchLessonSummariesForTopic(snap.id);
                return {
                    id: snap.id,
                    title: d.title,
                    description: d.description,
                    orderIndex: d.orderIndex,
                    lessons,
                };
            })
        );
    }

    async findLessonById(id: string): Promise<LessonDoc | null> {
        const snap = await this.db.collection('lessons').doc(id).get();
        if (!snap.exists) return null;
        const d = snap.data()!;

        const topicSnap = await this.db.collection('academyTopics').doc(d.topicId).get();
        const topicData = topicSnap.data() ?? {};
        const topicLessons = await fetchLessonSummariesForTopic(d.topicId);

        const topic: AcademyTopicDoc = {
            id: topicSnap.id,
            title: topicData.title,
            description: topicData.description,
            orderIndex: topicData.orderIndex,
            lessons: topicLessons,
        };

        const quizzes = await fetchQuizzesForLesson(id);

        return {
            id: snap.id,
            topicId: d.topicId,
            topic,
            title: d.title,
            contentMarkdown: d.contentMarkdown,
            orderIndex: d.orderIndex,
            quizzes,
        };
    }

    async saveProgress(userId: string, lessonId: string, isCompleted: boolean): Promise<ProgressDoc> {
        const docId = `${userId}_${lessonId}`;
        const completedAt = new Date();
        const ref = this.db.collection('progress').doc(docId);

        const existing = await ref.get();
        if (existing.exists) {
            await ref.update({ isCompleted, completedAt });
        } else {
            await ref.set({ userId, lessonId, isCompleted, completedAt });
        }

        return { id: docId, userId, lessonId, isCompleted, completedAt };
    }

    async getUserProgress(userId: string): Promise<ProgressDoc[]> {
        const q = await this.db
            .collection('progress')
            .where('userId', '==', userId)
            .where('isCompleted', '==', true)
            .get();

        return q.docs.map((snap) => {
            const d = snap.data();
            return {
                id: snap.id,
                userId: d.userId,
                lessonId: d.lessonId,
                isCompleted: d.isCompleted,
                completedAt: d.completedAt?.toDate() ?? new Date(),
            };
        });
    }
}
