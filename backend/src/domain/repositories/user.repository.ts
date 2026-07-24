// Plain TypeScript domain types — no Prisma dependency

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
}

export interface UserDoc {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    avatar?: string;
    country?: string;
    isVerified: boolean;
    roleId: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserRepository {
    findById(id: string): Promise<UserDoc | null>;
    findByEmail(email: string): Promise<UserDoc | null>;
    findByUsername(username: string): Promise<UserDoc | null>;
    create(data: { email: string; username: string; passwordHash: string; roleId: string }): Promise<UserDoc>;
    update(id: string, data: Partial<UserDoc>): Promise<UserDoc>;
    findAll(skip?: number, take?: number): Promise<UserDoc[]>;
    delete(id: string): Promise<UserDoc>;
    count(): Promise<number>;
}
