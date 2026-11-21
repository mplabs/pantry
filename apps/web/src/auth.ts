import NextAuth from "next-auth";
import Passkey from "next-auth/providers/passkey";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";

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
  // Production: AUTH_URL/AUTH_SECRET must be set; trustHost only if explicitly opted in
  // (AUTH_TRUST_HOST=true, e.g. behind a trusted reverse proxy). Dev trusts the local host.
  trustHost: !isProd || process.env.AUTH_TRUST_HOST === "true",
  useSecureCookies: isProd,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // sessions expire after 30 days
    updateAge: 24 * 60 * 60, // sliding expiry: refresh at most once a day
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
