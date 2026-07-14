import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";

import { AuthLoading } from "@/components/marketing/auth-loading";
// import { DemoLoginButton } from "@/components/marketing/demo-login-button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <ClerkLoading>
        <AuthLoading />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn />
        {/* <DemoLoginButton /> */}
      </ClerkLoaded>
    </div>
  );
}
