// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri: string = process.env.MONGODB_URI as string;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
}

declare global {
    interface Global {
        _mongoClientPromise: Promise<MongoClient>;
    }
}

// Prevent multiple instances of MongoClient in development
const globalWithMongoClientPromise = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongoClientPromise._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongoClientPromise._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongoClientPromise._mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export async function connectToDatabase() {
    const client = await clientPromise;
    const dbName: string = process.env.MONGODB_DB as string;
    const db = client.db(dbName);
    return { client, db };
}