import type { Metadata } from "next";

import { GuestHistoryListClient } from "@/components/guest-charts/guest-history-list-client";

export const metadata: Metadata = {
  title: "Ad-hoc Local History | AstroLogic",
  description: "View ad-hoc chart calculations stored only in your browser.",
};

export default function GuestChartsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Local History
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ad-hoc Charts</h1>
      </div>
      <GuestHistoryListClient />
    </main>
  );
}
