"use client";

import { useState } from "react";
import { signIn } from "next-auth/webauthn";

type PasskeyAuthCardProps = {
  heading?: string;
  blurb?: string;
};

export function PasskeyAuthCard({
  heading = "Sign in with Passkey",
  blurb = "Use your passkey to sign in or create your account.",
}: PasskeyAuthCardProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function startPasskey(explicitRegister: boolean) {
    setPending(true);
    setError("");

    try {
      await signIn("passkey", {
        email,
        name: name || undefined,
        action: explicitRegister ? "register" : undefined,
        redirectTo: "/",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Passkey flow failed.");
      setPending(false);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-xl gap-4 rounded-2xl border border-emerald-950/10 bg-white/95 p-6 shadow-sm">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-sm text-slate-600">{blurb}</p>
      </header>

      <label className="grid gap-1 text-sm">
        Email
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Display name (optional)
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Household name"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending || email.trim().length === 0}
          onClick={() => startPasskey(false)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          Continue with Passkey
        </button>
        <button
          type="button"
          disabled={pending || email.trim().length === 0}
          onClick={() => startPasskey(true)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Register new passkey
        </button>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
