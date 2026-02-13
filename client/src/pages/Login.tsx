import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <defs>
                  <clipPath id="lp1"><path d="M10,22 C10,14 16,8 24,8 L42,8 C42,8 44,28 38,34 C32,40 28,42 28,42 L8,42 C8,34 10,28 10,22Z" /></clipPath>
                  <clipPath id="lp2"><path d="M52,8 L72,8 C80,8 86,14 86,22 C86,28 86,34 86,42 L66,42 C66,42 62,40 56,34 C50,28 52,8 52,8Z" /></clipPath>
                  <clipPath id="lp3"><path d="M8,52 L28,52 C28,52 32,54 38,60 C44,66 42,86 42,86 L24,86 C16,86 10,80 10,72 L10,52Z" /></clipPath>
                  <clipPath id="lp4"><path d="M66,52 L86,52 L86,72 C86,80 80,86 72,86 L52,86 C52,86 50,66 56,60 C62,54 66,52 66,52Z" /></clipPath>
                  <clipPath id="lp5"><path d="M30,36 C36,30 40,28 46,32 C52,36 54,40 60,34 C66,28 64,36 64,42 C64,48 66,52 60,58 C54,64 52,66 46,62 C40,58 38,54 32,60 C26,66 28,58 28,52 C28,46 24,42 30,36Z" /></clipPath>
                </defs>
                <rect clipPath="url(#lp1)" x="0" y="0" width="50" height="50" fill="#0055a4" />
                <rect clipPath="url(#lp2)" x="45" y="0" width="50" height="50" fill="#22a7c4" />
                <rect clipPath="url(#lp3)" x="0" y="45" width="50" height="50" fill="#10b981" />
                <rect clipPath="url(#lp4)" x="45" y="45" width="50" height="50" fill="#0e9a7a" />
                <rect clipPath="url(#lp5)" x="20" y="25" width="55" height="55" fill="#1a8fd0" />
              </svg>
            </div>
            <span className="text-3xl font-black tracking-tight text-foreground" style={{ fontFamily: "'Georgia', serif" }}>CQFD</span>
          </div>
          <CardTitle className="text-lg font-semibold">Formation</CardTitle>
          <CardDescription>
            Connectez-vous pour acceder a votre espace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || loginError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || loginError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublie ?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
