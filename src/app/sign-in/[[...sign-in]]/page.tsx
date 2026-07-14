import { SignIn } from "@clerk/nextjs";

import { DemoLoginButton } from "@/components/marketing/demo-login-button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <SignIn />
      <DemoLoginButton />
    </div>
  );
}
