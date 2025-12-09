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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Setări - AdventureTime.Ro",
  description: "Gestionează setările contului tău",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Setări cont</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificări</CardTitle>
              <CardDescription>
                Configurează modul în care primești notificări
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificări prin email</Label>
                  <p className="text-sm text-muted-foreground">
                    Primește notificări prin email despre aventuri noi și actualizări
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  defaultChecked={true}
                  aria-readonly
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Securitate</CardTitle>
              <CardDescription>
                Gestionează setările de securitate ale contului tău
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Parolă</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {session?.user?.oauth_provider
                    ? "Folosești autentificare OAuth, nu este necesară parola"
                    : "Actualizează-ți parola în mod regulat pentru a-ți menține contul securizat"}
                </p>
                {!session?.user?.oauth_provider && (
                  <Button variant="outline">Schimbă parola</Button>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-red-600">Zonă periculoasă</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Șterge permanent contul tău și toate datele asociate
                </p>
                <Button variant="destructive">Șterge contul</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 