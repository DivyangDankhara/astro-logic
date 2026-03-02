export const clerkEnv = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
};

export function isClerkConfigured(): boolean {
  return Boolean(clerkEnv.publishableKey && clerkEnv.secretKey);
}
