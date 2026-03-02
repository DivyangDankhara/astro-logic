import { auth } from "@clerk/nextjs/server";

import { unauthorizedError } from "@/lib/api/errors";

export interface AuthUser {
  userId: string;
  email: string | null;
}

function mapSessionToUser(
  session: Awaited<ReturnType<typeof auth>>,
): AuthUser | null {
  if (!session.userId) {
    return null;
  }

  const claims = session.sessionClaims as Record<string, unknown> | null | undefined;
  const email =
    (claims?.email as string | undefined) ??
    (claims?.email_address as string | undefined) ??
    null;

  return {
    userId: session.userId,
    email,
  };
}

export async function requireAuthUserId(): Promise<string> {
  const session = await auth();

  if (!session.userId) {
    throw unauthorizedError("Sign in to continue");
  }

  return session.userId;
}

export async function requireAuthUser(): Promise<AuthUser> {
  const session = await auth();
  const user = mapSessionToUser(session);

  if (!user) {
    throw unauthorizedError("Sign in to continue");
  }

  return user;
}

export async function getOptionalAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  return mapSessionToUser(session);
}
