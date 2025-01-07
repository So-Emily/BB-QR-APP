// src/pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateUser } from '@/lib/auth';

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                identifier: { label: "Username or Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                if (!credentials) {
                    return null;
                }
                const user = await authenticateUser(credentials.identifier, credentials.password);
                if (user) {
                    return user;
                } else {
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error'
    },
    callbacks: {
        async session({ session, token }) {
            console.log('Session Callback - Token:', token);
    
            if (token && session.user) {
                session.user.role = token.role as string; // Add role to session
                session.user.id = token.id as string;    // Add userId to session
            }
    
            console.log('Session Callback - Session:', session);
            return session;
        },
        async jwt({ token, user }) {
            console.log('JWT Callback - User:', user);
    
            // Add userId and role to the token
            if (user) {
                token.role = user.role;
                token.id = user.id || user.userId; // Ensure userId is included
            }
    
            console.log('JWT Callback - Token:', token);
            return token;
        }
    }
});
