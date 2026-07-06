import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";

export default function HomePage() {
  return (
    <div className="w-full">
      <AuthRedirectHandler />
      {/* HomePage Shell */}
    </div>
  );
}
