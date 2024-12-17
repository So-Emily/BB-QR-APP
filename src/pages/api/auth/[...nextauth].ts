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
            if (token && session.user) {
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    }
});