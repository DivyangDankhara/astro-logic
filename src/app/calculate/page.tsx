import type { Metadata } from "next";

import { CalculateFormClient } from "@/components/calculate/calculate-form-client";

export const metadata: Metadata = {
  title: "Calculate Chart | AstroLogic",
  description:
    "Calculate precise sidereal planetary positions using Swiss Ephemeris and Lahiri ayanamsha.",
};

export default function CalculatePage() {
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
          Enter accurate birth details to compute sidereal planetary longitudes, rashis,
          nakshatras, and retrograde states from Swiss Ephemeris.
        </p>
      </div>
      <CalculateFormClient />
    </main>
  );
}
