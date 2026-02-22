import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      if (email === SUPER_ADMIN_EMAIL) return true;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !!existing;
    },
    async jwt({ token, user, trigger }) {
      const email = user?.email?.toLowerCase() ?? (token.email as string | undefined)?.toLowerCase();

      if (email) {
        const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
        const isSignIn = trigger === "signIn" || trigger === "signUp";

        try {
          if (isSignIn) {
            const dbUser = await prisma.user.upsert({
              where: { email },
              update: {
                name: user?.name ?? undefined,
                ...(isSuperAdmin ? { globalRole: "SUPER_ADMIN" } : {}),
              },
              create: {
                email,
                name: user?.name ?? (token.name as string) ?? email,
                globalRole: isSuperAdmin ? "SUPER_ADMIN" : "VIEWER",
              },
              select: { id: true, globalRole: true },
            });
            token.id = dbUser.id;
            token.globalRole = dbUser.globalRole;
          } else {
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true, globalRole: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.globalRole = dbUser.globalRole;
            }
          }
        } catch {
          if (user) {
            token.id = user.id!;
            token.globalRole = isSuperAdmin ? "SUPER_ADMIN" : "VIEWER";
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
    error: "/",
  },
});
