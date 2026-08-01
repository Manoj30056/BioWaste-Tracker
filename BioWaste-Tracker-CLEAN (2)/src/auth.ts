import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const dbUser = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
          if (dbUser.length === 0 || !dbUser[0].password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, dbUser[0].password);
          if (!isValid) return null;

          return {
            id: dbUser[0].id,
            name: dbUser[0].name || "",
            email: dbUser[0].email || "",
            image: dbUser[0].image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: { 
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      // Handle session updates
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        try {
          const dbUser = await db.select().from(users).where(eq(users.id, token.id as string)).limit(1);
          if (dbUser[0]) {
            session.user.role = dbUser[0].role;
            session.user.facilityId = dbUser[0].facilityId;
            session.user.isApproved = dbUser[0].isApproved;
            session.user.name = dbUser[0].name;
          } else {
            // User not found, clear session
            session.user.role = undefined;
            session.user.facilityId = undefined;
          }
        } catch (error) {
          console.error("Session callback error:", error);
          // Don't throw - just use basic session
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || "biowaste-tracker-secret-key-2024",
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "inspector" | "facility_manager" | "collector";
      facilityId?: number | null;
      isApproved?: boolean;
    };
  }
}
