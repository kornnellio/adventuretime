'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { registerUser } from '@/lib/actions/auth-actions';

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Check if passwords match
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'Parolele nu se potrivesc.',
      });
      setIsLoading(false);
      return;
    }

    const result = await registerUser(formData);

    if (result.success) {
      toast({
        title: 'Succes',
        description: 'Contul tău a fost creat. Te rugăm să te conectezi.',
      });
      router.push('/login');
    } else {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: result.message,
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 group">
              <Label htmlFor="name" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
                Prenume
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Prenumele tău"
                autoCapitalize="words"
                autoComplete="given-name"
                required
                disabled={isLoading}
                className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid gap-2 group">
              <Label htmlFor="surname" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
                Nume
              </Label>
              <Input
                id="surname"
                name="surname"
                type="text"
                placeholder="Numele tău"
                autoCapitalize="words"
                autoComplete="family-name"
                required
                disabled={isLoading}
                className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="grid gap-2 group">
            <Label htmlFor="username" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Nume utilizator
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Alege un nume de utilizator"
              autoComplete="username"
              required
              disabled={isLoading}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
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
            />
          </div>
          <div className="grid gap-2 group">
            <Label htmlFor="password" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Parolă
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Alege o parolă sigură"
              autoComplete="new-password"
              required
              disabled={isLoading}
              minLength={8}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-2 group">
            <Label htmlFor="confirmPassword" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Confirmă parola
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repetă parola"
              autoComplete="new-password"
              required
              disabled={isLoading}
              minLength={8}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Creează cont
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
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Continuă cu Google
      </Button>
    </div>
  );
} 