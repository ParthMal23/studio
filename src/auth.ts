
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import type { User as NextAuthUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & NextAuthUser
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Dynamically import models and db connection only within the Node.js runtime
        const dbConnect = (await import("@/lib/mongodb")).default;
        const User = (await import("@/models/User")).default;

        if (!credentials?.email || !credentials.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email as string }).select('+password');

        if (!user || !user.password) {
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (isPasswordCorrect) {
          // The user object returned here will be passed to the `jwt` and `session` callbacks.
          return { id: user._id.toString(), name: user.name, email: user.email };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})
