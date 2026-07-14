import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";

import { AuthLoading } from "@/components/marketing/auth-loading";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ClerkLoading>
        <AuthLoading />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp />
      </ClerkLoaded>
    </div>
  );
}
