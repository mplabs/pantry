"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { signIn } from "next-auth/webauthn";

export function SessionControls() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addPasskey() {
    setBusy(true);
    setError("");
    try {
      await signIn("passkey", {
        action: "register",
        redirectTo: "/",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to register passkey.");
      setBusy(false);
    }
  }

  async function signOutNow() {
    setBusy(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addPasskey}
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Add passkey
        </button>
        <button
          type="button"
          onClick={signOutNow}
          disabled={busy}
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          Sign out
        </button>
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
