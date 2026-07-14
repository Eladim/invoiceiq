import { AuthPanel } from "@/components/marketing/auth-panel";
// import { DemoLoginButton } from "@/components/marketing/demo-login-button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <AuthPanel mode="sign-in" />
      {/* <DemoLoginButton /> */}
    </div>
  );
}
