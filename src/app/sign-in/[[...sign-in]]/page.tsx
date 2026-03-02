import { SignIn } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isClerkConfigured } from "@/lib/clients/clerk";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-12 lg:px-10">
        <Alert>
          <AlertTitle>Sign-in unavailable</AlertTitle>
          <AlertDescription>
            Clerk is not configured in this environment. Set Clerk publishable and secret keys.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-12 lg:px-10">
      <SignIn forceRedirectUrl="/profile" />
    </main>
  );
}
