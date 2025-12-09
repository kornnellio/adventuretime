'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { requestPasswordReset } from '@/lib/actions/auth-actions';

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await requestPasswordReset(formData);

      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'Verifică-ți inbox-ul',
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

  if (emailSent) {
    return (
      <div className="mt-8 text-center">
        <div className="flex justify-center mb-4">
          <Icons.check className="h-12 w-12 text-green-500 p-2 bg-green-100 rounded-full" />
        </div>
        <h3 className="text-lg font-medium mb-2">Verifică-ți email-ul</h3>
        <p className="text-muted-foreground mb-6">
          Dacă adresa ta de email este înregistrată în sistemul nostru, ți-am trimis instrucțiuni despre cum să-ți resetezi parola.
        </p>
        <p className="text-sm text-muted-foreground">
          Nu vezi email-ul? Verifică directorul de spam sau asigură-te că ai introdus adresa corectă de email.
        </p>
      </div>
    );
  }

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
            Trimite link de resetare
          </Button>
        </div>
      </form>
    </div>
  );
} 
