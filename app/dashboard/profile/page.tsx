import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Profil - AdventureTime.Ro",
  description: "Profilul tău pe AdventureTime.Ro",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container py-4 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Profil</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2 sm:pb-6">
              <Avatar className="h-14 w-14">
                <AvatarImage 
                  src={session?.user?.image || ''} 
                  alt={session?.user?.name || ''} 
                />
                <AvatarFallback className="text-lg">
                  {session?.user?.name?.charAt(0) || session?.user?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {session?.user?.name} {session?.user?.surname}
                </CardTitle>
                <CardDescription className="text-sm">
                  @{session?.user?.username} · Înscris la{" "}
                  {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </h3>
                    <p className="text-sm sm:text-base break-words">{session?.user?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Nume utilizator
                    </h3>
                    <p className="text-sm sm:text-base">{session?.user?.username}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Metodă de autentificare
                  </h3>
                  <p className="text-sm sm:text-base">
                    {session?.user?.oauth_provider
                      ? `OAuth (${session.user.oauth_provider})`
                      : "Email și parolă"}
                  </p>
                </div>

                <div className="border-t pt-4 mt-2">
                  <h3 className="text-sm font-medium mb-2">
                    Informații cont
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Contul tău este activ și în regulă.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 