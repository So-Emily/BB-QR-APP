import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    storeDetails?: {
        storeName: string;
        storeNumber: number;
    }; 
}

interface MongoDBUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    role: string;
    storeDetails?: {
        storeName: string;
        storeNumber: number;
    }; 
}

export async function authenticateUser(identifier: string, password: string): Promise<User | null> {
    const normalizedIdentifier = identifier.toLowerCase();
    const user = await findUserByIdentifier(normalizedIdentifier);

    if (user && await bcrypt.compare(password, user.password)) {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            storeDetails: user.storeDetails,
        };
    }

    return null;
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

async function findUserByIdentifier(identifier: string): Promise<MongoDBUser | null> {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
        $or: [
            { email: identifier },
            { name: identifier }
        ]
    });

    if (!user) {
        return null;
    }

    return user as MongoDBUser;
}