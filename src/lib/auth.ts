import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (username === "admin" && password === "admin") {
          return {
            id: "admin-local",
            name: "Admin",
            email: "admin@meetup-manager.local",
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const email = user?.email ?? (token.email as string | undefined);

      if (email) {
        try {
          const isSignIn = trigger === "signIn" || trigger === "signUp";
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: isSignIn ? { name: user?.name ?? undefined } : {},
            create: {
              email,
              name: user?.name ?? (token.name as string) ?? "Admin",
              globalRole: "ADMIN",
            },
            select: { id: true, globalRole: true },
          });
          token.id = dbUser.id;
          token.globalRole = dbUser.globalRole;
        } catch {
          if (user) {
            token.id = user.id!;
            token.globalRole = "ADMIN";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.globalRole = token.globalRole as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
