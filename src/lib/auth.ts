import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';

interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
}

export async function authenticateUser(identifier: string, password: string): Promise<User | null> {
    const user = await findUserByIdentifier(identifier);
    if (user && await bcrypt.compare(password, user.password)) {
        return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role
        };
    }
    return null;
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function createUser({ name, email, password, role }: { name: string; email: string; password: string; role: string }): Promise<User> {
    const hashedPassword = await hashPassword(password);
    const user: User = {
        id: Date.now().toString(), // Ensure id is a string
        name,
        email,
        password: hashedPassword,
        role
    };

    const { db } = await connectToDatabase();
    await db.collection('users').insertOne(user);

    return user;
}

async function findUserByIdentifier(identifier: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ $or: [{ email: identifier }, { name: identifier }] });
    return user ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role
    } : null;
}