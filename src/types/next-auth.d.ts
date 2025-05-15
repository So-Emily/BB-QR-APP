import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string; // Unique user identifier (MongoDB ObjectId)
        userId?: string; // Optional userId field
        role: string; // User's role (e.g., supplier, admin, etc.)
        storeDetails?: {
            storeName: string;
            storeNumber: number;
        };
            
    }

    interface Session {
        user: {
            id: string; // Ensure id is part of the session
            userId?: string; // Optional userId for custom handling
            role: string; // Role of the user
            storeName?: string; // Optional store name for suppliers
            storeId?: string; // Optional store ID for suppliers
            storeDetails?: {
                storeName: string;
                storeNumber: number;
            };
        } & DefaultSession['user'];
    }

    interface JWT {
        id: string; // Unique user identifier for JWT
        userId?: string; // Optional userId for JWT
        role: string; // Role of the user
        storeDetails?: {
            storeName: string;
            storeNumber: number;
        };
    }
}
