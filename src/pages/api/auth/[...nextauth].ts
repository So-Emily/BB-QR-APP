import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/auth";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
      
        const normalizedIdentifier = credentials.identifier.toLowerCase();
        const user = await authenticateUser(normalizedIdentifier, credentials.password);
      
        if (user) {
          console.log("User in authorize function:", user); // Debugging user object
      
          // Add storeDetails only for store-manager users
          if (user.role === "store-manager" && user.storeDetails) {
            return {
              ...user,
              storeDetails: user.storeDetails, // Include storeDetails in the returned user object
            };
          }
      
          return user; // Return the user as-is for other roles (e.g., supplier)
        }
      
        return null;
      },
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
    
        // Add storeDetails only for store-manager users
        if (token.role === "store-manager" && token.storeDetails) {
          session.user.storeDetails = token.storeDetails as { storeName: string; storeNumber: number };
        }
      }
      console.log("Session in session callback:", session); // Debugging session
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = user.role;
        token.id = user.id || user.userId;
    
        // Add storeDetails only for store-manager users
        if (user.role === "store-manager" && user.storeDetails) {
          token.storeDetails = user.storeDetails; // Include storeDetails in the token
        }
      }
      console.log("Token in jwt callback:", token); // Debugging token
      return token;
    }
  }
};

export default NextAuth(authOptions);
