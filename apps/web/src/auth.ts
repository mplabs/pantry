import NextAuth from "next-auth";
import Passkey from "next-auth/providers/passkey";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Passkey({
      formFields: {
        email: {
          label: "Email",
          required: true,
          autocomplete: "username webauthn",
        },
        name: {
          label: "Display name",
          required: false,
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  experimental: {
    enableWebAuthn: true,
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
