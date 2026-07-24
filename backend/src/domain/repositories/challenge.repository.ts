// Plain TypeScript domain types — no Prisma dependency

export interface Category {
    id: string;
    name: string;
    description?: string;
}

export interface HintDoc {
    id: string;
    challengeId: string;
    content: string;
    costPoints: number;
}

export interface ChallengeDoc {
    id: string;
    title: string;
    difficulty: string;
    description: string;
    objectives: string;
    categoryId: string;
    category?: Category;
    points: number;
    tags: string;
    estimatedTime: number;
    isActive: boolean;
    dockerImage?: string;
    sourceCodeUrl?: string;
    createdAt: Date;
    hints?: HintDoc[];
}

export interface SubmissionDoc {
    id: string;
    userId: string;
    challengeId: string;
    submittedFlag: string;
    isCorrect: boolean;
    submittedAt: Date;
    challenge?: { points: number };
}

export interface IChallengeRepository {
    findById(id: string): Promise<(ChallengeDoc & { hints: HintDoc[] }) | null>;
    findAllActive(): Promise<(ChallengeDoc & { category: Category })[]>;
    findAllAdmin(): Promise<ChallengeDoc[]>;
    create(data: any): Promise<ChallengeDoc>;
    update(id: string, data: any): Promise<ChallengeDoc>;
    delete(id: string): Promise<ChallengeDoc>;

    // Flag & Submission
    findFlagForChallenge(challengeId: string): Promise<string | null>;
    createSubmission(data: { userId: string; challengeId: string; submittedFlag: string; isCorrect: boolean }): Promise<SubmissionDoc>;
    hasSolved(userId: string, challengeId: string): Promise<boolean>;
    countUserSolved(userId: string): Promise<number>;
    getUserPoints(userId: string): Promise<number>;

    // Hints
    findHintById(hintId: string): Promise<HintDoc | null>;
}
