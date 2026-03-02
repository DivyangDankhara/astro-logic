import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { CalculateFormClient } from "@/components/calculate/calculate-form-client";

export const metadata: Metadata = {
  title: "Calculate Chart | AstroLogic",
  description:
    "Calculate precise sidereal planetary positions using Swiss Ephemeris and Lahiri ayanamsha.",
};

export default async function CalculatePage() {
  const session = await auth();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="mb-8 max-w-3xl space-y-3">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          AstroLogic Calculator
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Scientific Vedic Chart Generation
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Use ad-hoc local-only calculation for any person. Profile-linked Kundli is managed
          separately under your account profile.
        </p>
      </div>
      <CalculateFormClient
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        isSignedIn={Boolean(session.userId)}
      />
    </main>
  );
}
