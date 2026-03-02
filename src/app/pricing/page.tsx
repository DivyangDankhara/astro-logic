import type { Metadata } from "next";

import { PricingClient } from "@/components/billing/pricing-client";

export const metadata: Metadata = {
  title: "Pricing | AstroLogic",
  description: "Choose Free or Pro for scientific Vedic chart workflows.",
};

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Plans
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="text-muted-foreground text-base">
          Start free with limited usage or upgrade to Pro for unlimited chart calculations
          and AI interpretations.
        </p>
      </div>
      <PricingClient />
    </main>
  );
}
