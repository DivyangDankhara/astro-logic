import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AccountSettingsClient } from "@/components/account/account-settings-client";

export const metadata: Metadata = {
  title: "Account | AstroLogic",
  description: "Manage your account settings and data retention preferences.",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12 lg:px-10">
      <div className="mb-8 space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          Account
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
      </div>
      <AccountSettingsClient />
    </main>
  );
}
