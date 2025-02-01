import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const uri: string = process.env.MONGODB_URI as string;
const options = {
    maxPoolSize: 10, // Limit the number of simultaneous connections
    minPoolSize: 2,  // Maintain a minimum number of connections
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if the server cannot be found
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
}

// Ensure global declarations in development
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // Use a global variable to preserve the client during hot reloads
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // Create a new client for production
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export async function connectToDatabase() {
    try {
        console.log('Attempting to connect to MongoDB...');
        const client = await clientPromise;
        console.log('Connected to MongoDB successfully.');

        const dbName: string = process.env.MONGODB_DB as string;
        const db = client.db(dbName);

        // Ensure Mongoose uses the same connection
        if (mongoose.connection.readyState === 0) {
            mongoose.set('strictQuery', true);
            await mongoose.connect(uri);
        }

        return { client, db };
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw new Error('MongoDB connection failed');
    }
}