import Link from "next/link";

import { auth } from "@/auth";
import { AcceptInviteCard } from "@/components/accept-invite-card";
import { PasskeyAuthCard } from "@/components/passkey-auth-card";

export default async function JoinHouseholdPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-start gap-4 px-4 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Household Invite</h1>
        <p className="mt-1 text-sm text-slate-600">
          This link adds you to a shared pantry household.
        </p>
      </section>

      {session?.user?.email ? (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <AcceptInviteCard token={token} />
          <Link href="/" className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        </section>
      ) : (
        <PasskeyAuthCard
          heading="Sign in to accept invite"
          blurb="After sign-in, return to this link and you will be added to the household."
        />
      )}
    </main>
  );
}
