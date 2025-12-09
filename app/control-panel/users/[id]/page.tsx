'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserById, updateUser } from '@/lib/actions/user';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { IUser } from '@/lib/models/user';
import { format } from 'date-fns';

// Define form schema
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  surname: z.string().min(2, {
    message: 'Surname must be at least 2 characters.',
  }),
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().optional(),
});

// Next.js is changing how params are handled
// This is a safer way to handle the transition period
export default function EditUserPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Safe extraction of id that works with both current and future Next.js versions
  const idPromise = Promise.resolve(params).then(p => p.id);
  const [userId, setUserId] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<IUser & { _id: string | { toString(): string } } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup form
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      surname: '',
      username: '',
      email: '',
      password: '',
    },
  });

  // Extract the user ID from params first
  useEffect(() => {
    idPromise.then(id => {
      setUserId(id);
    });
  }, [idPromise]);

  // Fetch user data after we have the ID
  useEffect(() => {
    if (!userId) return;
    
    const fetchUser = async () => {
      try {
        const { success, data, error } = await getUserById(userId);
        
        if (!success || !data) {
          return notFound();
        }
        
        setUser(data);
        form.reset({
          name: data.name,
          surname: data.surname,
          username: data.username,
          email: data.email,
          password: '',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [userId, form, toast]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    if (!userId) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateUser(userId, values);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Success',
        description: 'User information updated successfully',
      });
      
      // Refresh the data
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        </div>
        <div className="text-center p-8">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return notFound();
  }

  const userIdValue = typeof user._id === 'string' ? user._id : user._id.toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <Button variant="outline" asChild>
          <Link href="/control-panel/users">Back to Users</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            View and edit user information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">User ID:</p>
                <p className="text-muted-foreground">{userIdValue}</p>
              </div>
              <div>
                <p className="font-semibold">Sign Up Date:</p>
                <p className="text-muted-foreground">
                  {format(new Date(user.sign_up_date), 'PPP')}
                </p>
              </div>
              <div>
                <p className="font-semibold">Authentication Method:</p>
                <p className="text-muted-foreground">{user.oauth_provider || 'Local'}</p>
              </div>
              <div>
                <p className="font-semibold">Total Orders:</p>
                <p className="text-muted-foreground">{user.orders?.length || 0}</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="Leave blank to keep current password" 
                          />
                        </FormControl>
                        <FormDescription>
                          Only fill this if you want to change the user's password.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
