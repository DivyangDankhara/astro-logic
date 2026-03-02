import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { LinkedKundliClient } from "@/components/kundli/linked-kundli-client";

export const metadata: Metadata = {
  title: "Linked Kundli | AstroLogic",
  description: "View a linked profile's Vedic Kundli and planetary positions.",
};

interface LinkedKundliPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LinkedKundliPage({ params }: LinkedKundliPageProps) {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Kundli
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Linked Kundli</h1>
      </div>
      <LinkedKundliClient linkedProfileId={id} />
    </main>
  );
}
