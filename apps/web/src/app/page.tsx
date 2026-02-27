import { auth } from "@/auth";
import { PantryDashboard } from "@/components/pantry-dashboard";
import { PasskeyAuthCard } from "@/components/passkey-auth-card";
import { SessionControls } from "@/components/session-controls";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:px-8">
      {session?.user?.email ? (
        <>
          <section className="flex justify-end">
            <SessionControls />
          </section>
          <PantryDashboard
            user={{
              email: session.user.email,
              name: session.user.name,
            }}
          />
        </>
      ) : (
        <PasskeyAuthCard />
      )}
    </div>
  );
}
