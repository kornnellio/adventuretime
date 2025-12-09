'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { resetPassword } from '@/lib/actions/auth-actions';

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // If no token is provided, show an error
  if (!token) {
    return (
      <div className="mt-8 text-center">
        <div className="flex justify-center mb-4">
          <Icons.warning className="h-12 w-12 text-amber-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">Link de resetare invalid</h3>
        <p className="text-muted-foreground mb-6">
          Link-ul de resetare a parolei pare să fie invalid sau expirat.
        </p>
        <Button 
          onClick={() => router.push('/forgot-password')} 
          className="mt-2 w-full h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
        >
          Solicită un nou link de resetare
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

      // Add token to form data
      formData.append('token', token);
      
      const result = await resetPassword(formData);

      if (result.success) {
        setResetComplete(true);
        toast({
          title: 'Succes',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Eroare',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată. Te rugăm să încerci din nou.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetComplete) {
    return (
      <div className="mt-8 text-center">
        <div className="flex justify-center mb-4">
          <Icons.check className="h-12 w-12 text-green-500 p-2 bg-green-100 rounded-full" />
        </div>
        <h3 className="text-lg font-medium mb-2">Resetare parolă completă</h3>
        <p className="text-muted-foreground mb-6">
          Parola ta a fost actualizată cu succes. Acum te poți autentifica cu noua parolă.
        </p>
        <Button 
          onClick={() => router.push('/login')} 
          className="mt-2 w-full h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
        >
          Autentificare
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 mt-8">
      <form onSubmit={handleSubmit} className="animate-fadeIn">
        <div className="grid gap-5">
          <div className="grid gap-2 group">
            <Label htmlFor="password" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Parolă nouă
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isLoading}
              minLength={8}
              className="h-11 transition-all duration-200 border-input/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-2 group">
            <Label htmlFor="confirmPassword" className="text-sm font-medium group-focus-within:text-blue-600 transition-colors duration-200">
              Confirmă parola nouă
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
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
            Resetează parola
          </Button>
        </div>
      </form>
    </div>
  );
} 
