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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (dbUser.length === 0) {
          return null;
        }

        const user = dbUser[0];
        console.log("Found user:", user.email);

        if (!user.password) {
          console.log("User has no password");
          return null;
        }

        try {
          console.log("Comparing passwords...");
          const isValid = await bcrypt.compare(password, user.password);
          console.log("Is valid?", isValid);
          
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (err) {
          console.error("Auth error during comparison:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // Fetch additional user data
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser[0]) {
          session.user.role = dbUser[0].role;
          session.user.facilityId = dbUser[0].facilityId;
          session.user.isApproved = dbUser[0].isApproved;
          session.user.name = dbUser[0].name;
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || "biowaste-tracker-secret-key-change-in-production",
});

// Extend the session types
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
