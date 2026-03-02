import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { LinkedProfilesClient } from "@/components/profile/linked-profiles-client";

export const metadata: Metadata = {
  title: "Linked Profiles | AstroLogic",
  description: "Manage partner and child profiles tied to your main profile.",
};

export default async function LinkedProfilesPage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Profile
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Linked Profiles</h1>
      </div>
      <LinkedProfilesClient googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
    </main>
  );
}
