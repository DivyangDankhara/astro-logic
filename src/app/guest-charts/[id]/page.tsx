import type { Metadata } from "next";

import { GuestHistoryDetailClient } from "@/components/guest-charts/guest-history-detail-client";

export const metadata: Metadata = {
  title: "Ad-hoc Chart Detail | AstroLogic",
  description: "Inspect a locally stored ad-hoc chart calculation.",
};

interface GuestChartDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GuestChartDetailPage({ params }: GuestChartDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Local History
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ad-hoc Chart Detail</h1>
      </div>
      <GuestHistoryDetailClient id={id} />
    </main>
  );
}
