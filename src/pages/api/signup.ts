// src/pages/api/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { name, email, password, role } = req.body;

        // Connect to the database
        const { db } = await connectToDatabase();

        // Check if the user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role,
        };

        // Insert the new user into the database
        await db.collection('users').insertOne(newUser);

        // Redirect to the login page or dashboard
        return res.status(201).json({ message: 'User created successfully', redirectUrl: '/auth/signin' });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}