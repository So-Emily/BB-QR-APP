// src/pages/api/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { name, email, password, role, location, storeDetails } = req.body;

        try {
            const { db } = await connectToDatabase();

            // Normalize name and email to lowercase
            const normalizedEmail = email.toLowerCase();
            const normalizedName = name.toLowerCase();

            // Check if the user already exists
            const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the new user
            const newUser = {
                name: normalizedName,
                email: normalizedEmail,
                password: hashedPassword,
                role,
                ...(role === 'store-manager' && { location, storeDetails }),
            };

            // Insert the new user into the database
            await db.collection('users').insertOne(newUser);

            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}