'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { loginUser } from '@/lib/actions/auth-actions';
import { SuspenseWrapper } from './suspense-wrapper';
import { Alert, AlertDescription } from '@/components/ui/alert';

// This component is separate to isolate the useSearchParams call within Suspense
function LoginFormInner() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. First, validate credentials on the server
      const formData = new FormData(e.currentTarget);
      const result = await loginUser(formData);

      if (result.success) {
        // 2. If server validation succeeds, call NextAuth signIn to create the session
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError('Email sau parolă incorectă');
          toast({
            variant: 'destructive',
            title: 'Eroare',
            description: 'Email sau parolă incorectă. Vă rugăm să încercați din nou.',
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: 'Succes',
          description: 'V-ați conectat cu succes.',
        });
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.message);
        toast({
          variant: 'destructive',
          title: 'Eroare',
          description: result.message,
        });
        setIsLoading(false);
      }
    } catch (error) {
      setError('A apărut o eroare neașteptată');
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.',
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'A apărut o eroare la conectarea cu Google.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="grid gap-6 mt-8">
      <form onSubmit={handleSubmit} className="animate-fadeIn">
        <div className="grid gap-5">
          <div className="grid gap-2 group">
            <Label htmlFor="email" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nume@exemplu.com"
              autoComplete="email"
              required
              disabled={isLoading}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
                Parolă
              </Label>
              <Button 
                variant="link" 
                className="px-0 font-normal text-xs text-muted-foreground hover:text-blue-600 transition-colors duration-200" 
                asChild
              >
                <a href="/forgot-password">Ați uitat parola?</a>
              </Button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Conectează-te
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background/80 px-2 text-muted-foreground">
            Sau continuă cu
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
        className="h-12 font-medium bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 rounded-md"
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-5 w-5" />
        )}
        Sign in with Google
      </Button>
    </div>
  );
}

// Export the wrapped version
export function LoginForm() {
  return (
    <SuspenseWrapper>
      <LoginFormInner />
    </SuspenseWrapper>
  );
} 