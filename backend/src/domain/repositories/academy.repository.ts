// Plain TypeScript domain types — no Prisma dependency

export interface QuizDoc {
    id: string;
    lessonId: string;
    question: string;
    optionsJson: string;
    correctOption: string;
}

export interface LessonSummary {
    id: string;
    title: string;
    orderIndex: number;
}

export interface AcademyTopicDoc {
    id: string;
    title: string;
    description?: string;
    orderIndex: number;
    lessons: LessonSummary[];
}

export interface LessonDoc {
    id: string;
    topicId: string;
    topic: AcademyTopicDoc;
    title: string;
    contentMarkdown: string;
    orderIndex: number;
    quizzes: QuizDoc[];
}

export interface ProgressDoc {
    id: string;
    userId: string;
    lessonId: string;
    isCompleted: boolean;
    completedAt: Date;
}

export interface IAcademyRepository {
    findAllTopics(): Promise<AcademyTopicDoc[]>;
    findLessonById(id: string): Promise<LessonDoc | null>;
    saveProgress(userId: string, lessonId: string, isCompleted: boolean): Promise<ProgressDoc>;
    getUserProgress(userId: string): Promise<ProgressDoc[]>;
}
