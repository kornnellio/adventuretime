import { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Resetare parolă - Adventure Time.Ro",
  description: "Setează o nouă parolă pentru contul tău",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { token } = resolvedParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-pink-500/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative w-full max-w-md z-10 px-4">
        <div className="relative w-full rounded-xl border bg-background/90 p-8 shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_20px_60px_rgba(8,_112,_184,_0.3)]">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Resetează parola</h1>
            <p className="text-muted-foreground">
              Introdu noua ta parolă mai jos
            </p>
          </div>
          <ResetPasswordForm token={token} />
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Ți-ai amintit parola?{" "}
              <Link 
                href="/login" 
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors duration-200"
              >
                Autentificare
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
