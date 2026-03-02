import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { MainKundliClient } from "@/components/kundli/main-kundli-client";

export const metadata: Metadata = {
  title: "Main Kundli | AstroLogic",
  description: "View your main profile's Vedic Kundli and planetary positions.",
};

export default async function MainKundliPage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Kundli
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Main Kundli</h1>
      </div>
      <MainKundliClient />
    </main>
  );
}
