import { IUserRepository, UserDoc, Role } from '../../domain/repositories/user.repository';
import { FirebaseService } from '../firebase/firebase.service';

// ── helpers ────────────────────────────────────────────────────────────────

async function fetchRole(roleId: string): Promise<Role> {
    const snap = await FirebaseService.db().collection('roles').doc(roleId).get();
    if (!snap.exists) {
        return { id: roleId, name: 'USER', permissions: [] };
    }
    const data = snap.data()!;
    return {
        id: snap.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions ?? [],
    };
}

function docToUser(snap: FirebaseFirestore.DocumentSnapshot, role: Role): UserDoc {
    const d = snap.data()!;
    return {
        id: snap.id,
        email: d.email,
        username: d.username,
        passwordHash: d.passwordHash,
        avatar: d.avatar,
        country: d.country,
        isVerified: d.isVerified ?? false,
        roleId: d.roleId,
        role,
        createdAt: d.createdAt?.toDate() ?? new Date(),
        updatedAt: d.updatedAt?.toDate() ?? new Date(),
    };
}

// ── Repository ─────────────────────────────────────────────────────────────

export class UserRepositoryImpl implements IUserRepository {
    private get col() {
        return FirebaseService.db().collection('users');
    }

    async findById(id: string): Promise<UserDoc | null> {
        const snap = await this.col.doc(id).get();
        if (!snap.exists) return null;
        const role = await fetchRole(snap.data()!.roleId);
        return docToUser(snap, role);
    }

    async findByEmail(email: string): Promise<UserDoc | null> {
        const q = await this.col.where('email', '==', email).limit(1).get();
        if (q.empty) return null;
        const snap = q.docs[0];
        const role = await fetchRole(snap.data().roleId);
        return docToUser(snap, role);
    }

    async findByUsername(username: string): Promise<UserDoc | null> {
        const q = await this.col.where('username', '==', username).limit(1).get();
        if (q.empty) return null;
        const snap = q.docs[0];
        const role = await fetchRole(snap.data().roleId);
        return docToUser(snap, role);
    }

    async create(data: { email: string; username: string; passwordHash: string; roleId: string }): Promise<UserDoc> {
        const now = new Date();
        const ref = this.col.doc(); // auto-id
        const docData = {
            ...data,
            avatar: undefined as string | undefined,
            country: undefined as string | undefined,
            isVerified: false,
            createdAt: now,
            updatedAt: now,
        };
        await ref.set({ ...docData, avatar: null, country: null });
        const role = await fetchRole(data.roleId);
        return {
            id: ref.id,
            email: docData.email,
            username: docData.username,
            passwordHash: docData.passwordHash,
            roleId: docData.roleId,
            avatar: undefined,
            country: undefined,
            isVerified: false,
            createdAt: now,
            updatedAt: now,
            role,
        } as UserDoc;
    }

    async update(id: string, data: Partial<UserDoc>): Promise<UserDoc> {
        const updateData: any = { ...data, updatedAt: new Date() };
        // remove nested role object from Firestore write — only persist roleId
        delete updateData.role;
        await this.col.doc(id).update(updateData);
        const updated = await this.findById(id);
        if (!updated) throw new Error(`User ${id} not found after update`);
        return updated;
    }

    async findAll(skip = 0, take = 50): Promise<UserDoc[]> {
        const q = await this.col.orderBy('createdAt', 'desc').offset(skip).limit(take).get();
        return Promise.all(
            q.docs.map(async (snap) => {
                const role = await fetchRole(snap.data().roleId);
                return docToUser(snap, role);
            })
        );
    }

    async delete(id: string): Promise<UserDoc> {
        const user = await this.findById(id);
        if (!user) throw new Error(`User ${id} not found`);
        await this.col.doc(id).delete();
        return user;
    }

    async count(): Promise<number> {
        const snap = await this.col.count().get();
        return snap.data().count;
    }
}
