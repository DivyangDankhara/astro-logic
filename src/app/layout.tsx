import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { AstroPostHogProvider } from "@/components/providers/posthog-provider";
import { isClerkConfigured } from "@/lib/clients/clerk";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroLogic | Scientific Vedic Astrology",
  description:
    "AstroLogic is a modern, data-first Vedic astrology SaaS using Swiss Ephemeris and sidereal calculations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerk = isClerkConfigured();

  const content = (
    <AstroPostHogProvider
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      host={process.env.POSTHOG_HOST}
    >
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="font-semibold tracking-tight">
            AstroLogic
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-700">
            <Link href="/calculate">Calculate</Link>
            <Link href="/guest-charts">Ad-hoc History</Link>
            <Link href="/pricing">Pricing</Link>
            {!hasClerk ? (
              <>
                <Link href="/sign-in">Sign in</Link>
                <Link href="/sign-up">Sign up</Link>
              </>
            ) : (
              <>
                <SignedOut>
                  <Link href="/sign-in">Sign in</Link>
                  <Link href="/sign-up">Sign up</Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/profile">Profile</Link>
                  <Link href="/kundli/main">Kundli</Link>
                  <Link href="/account">Account</Link>
                  <UserButton />
                </SignedIn>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </AstroPostHogProvider>
  );

  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}
      >
        {hasClerk ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
