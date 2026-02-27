"use client";

import { useEffect, useState } from "react";

type AcceptInviteCardProps = {
  token: string;
};

export function AcceptInviteCard({ token }: AcceptInviteCardProps) {
  const [status, setStatus] = useState<"pending" | "done" | "failed">("pending");
  const [message, setMessage] = useState("Joining household...");

  useEffect(() => {
    async function acceptInvite() {
      try {
        const response = await fetch("/api/invites/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const payload = (await response.json()) as {
          household: {
            name: string;
          };
        };

        setStatus("done");
        setMessage(`Joined \"${payload.household.name}\". You can go back to the dashboard.`);
      } catch (error) {
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "Failed to accept invite.");
      }
    }

    acceptInvite();
  }, [token]);

  const classes =
    status === "done"
      ? "bg-emerald-50 text-emerald-800"
      : status === "failed"
        ? "bg-rose-50 text-rose-700"
        : "bg-slate-100 text-slate-700";

  return <p className={`rounded-xl px-4 py-3 text-sm ${classes}`}>{message}</p>;
}
