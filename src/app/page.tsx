import Link from "next/link";
import { ArrowRight, Orbit, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const useCases = [
  {
    title: "Career Timing",
    description:
      "Understand planetary cycles and decision windows using precise sidereal coordinates instead of generic horoscope text.",
  },
  {
    title: "Relationship Patterns",
    description:
      "Inspect Moon and Venus placements from astronomical data to evaluate compatibility themes with transparency.",
  },
  {
    title: "Health Rhythms",
    description:
      "Track long-term planetary motions and retrograde phases through a data-forward model for disciplined self-observation.",
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#dbeafe_0%,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#fef3c7_0%,_transparent_45%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="max-w-3xl space-y-8">
          <Badge className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            AstroLogic MVP
          </Badge>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-6xl">
            Vedic astrology, rebuilt with astronomical rigor.
          </h1>
          <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
            AstroLogic replaces cluttered prediction portals with a clean scientific workflow:
            exact sidereal planetary positions, transparent computation, and structured insight
            grounded in Swiss Ephemeris.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/calculate">
                Generate Chart
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/calculate">Try the calculator</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="grid gap-5 md:grid-cols-3">
          {useCases.map((item) => (
            <Card key={item.title} className="border-slate-200/80 bg-white/85 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-slate-700">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader className="space-y-3">
              <div className="bg-primary/10 text-primary w-fit rounded-full p-2">
                <Orbit className="size-5" />
              </div>
              <CardTitle>Scientific Core</CardTitle>
              <CardDescription className="text-slate-700">
                Swiss Ephemeris computes Julian day, sidereal longitudes, and true lunar nodes
                with Lahiri ayanamsha so every value is auditable.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader className="space-y-3">
              <div className="bg-primary/10 text-primary w-fit rounded-full p-2">
                <Sparkles className="size-5" />
              </div>
              <CardTitle>Modern Product UX</CardTitle>
              <CardDescription className="text-slate-700">
                Minimal interface, strict validation, and transparent raw output designed for users
                who value method, not mystique.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>
  );
}
