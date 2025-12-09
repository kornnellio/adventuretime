import Link from 'next/link';
import { getUsers } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DeleteUserButton from '@/components/control-panel/delete-user-button';
import { IUser } from '@/lib/models/user';

export const metadata = {
  title: 'Manage Users - AdventureTime.Ro',
  description: 'Manage users in the admin control panel',
};

export default async function UsersPage() {
  const { success, data: users, error } = await getUsers();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage your users. You can view details, edit information, or delete users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <div className="text-center p-6">
              <p className="text-red-500">{error || 'Failed to load users'}</p>
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sign Up Date</TableHead>
                  <TableHead>Auth Provider</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: IUser & { _id: { toString(): string } }) => (
                  <TableRow key={user._id.toString()}>
                    <TableCell className="font-medium">{user.name} {user.surname}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatDate(user.sign_up_date)}</TableCell>
                    <TableCell>{user.oauth_provider || 'Local'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/control-panel/users/${user._id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteUserButton userId={user._id.toString()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
