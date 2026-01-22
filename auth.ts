import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getOrCreateUser, getUserById } from "./lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Create or get user in our database
        await getOrCreateUser({
          email: user.email,
          name: user.name || "",
          googleId: account.providerAccountId,
        });
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        // Get user from database to check onboarding status
        const dbUser = await getUserById(session.user.email);
        if (dbUser) {
          session.user.id = dbUser.id.toString();
          session.user.onboarded = dbUser.onboarded;
          session.user.childName = dbUser.childName;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
