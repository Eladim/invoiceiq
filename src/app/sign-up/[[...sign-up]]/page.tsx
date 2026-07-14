import { AuthPanel } from "@/components/marketing/auth-panel";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <AuthPanel mode="sign-up" />
    </div>
  );
}
