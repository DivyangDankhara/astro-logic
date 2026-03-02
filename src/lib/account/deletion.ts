import { softDeleteUserAccount } from "@/lib/accounts/service";
import { softDeleteChartsForUser } from "@/lib/charts/service";
import { getSoftDeleteRetentionDays } from "@/lib/config/env";
import { softDeleteInterpretationsForUser } from "@/lib/interpretations/service";
import { softDeleteKundliForUser } from "@/lib/kundli/service";
import { softDeleteMainProfileForUser } from "@/lib/profiles/service";

export async function softDeleteAccountData(clerkUserId: string): Promise<{
  deletedAt: string;
  purgeAfterDays: number;
}> {
  await softDeleteInterpretationsForUser(clerkUserId);
  await softDeleteChartsForUser(clerkUserId);
  await softDeleteKundliForUser(clerkUserId);
  await softDeleteMainProfileForUser(clerkUserId);
  await softDeleteUserAccount(clerkUserId);

  return {
    deletedAt: new Date().toISOString(),
    purgeAfterDays: getSoftDeleteRetentionDays(),
  };
}
