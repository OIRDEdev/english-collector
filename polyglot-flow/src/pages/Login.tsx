import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Languages, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const GOOGLE_CLIENT_ID = "971837374738-3k3m704hipkqckl15q7qn38n97oqulgs.apps.googleusercontent.com"; // User needs to configure this

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = loginSchema.safeParse({ email, senha });
    if (!result.success) {
      const fieldErrors: { email?: string; senha?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "senha") fieldErrors.senha = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, senha);
      toast.success("Login realizado com sucesso!");
      navigate("/onboarding");
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao fazer login. Verifique suas credenciais.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Initialize Google Sign-In
    if (typeof google !== "undefined" && google.accounts) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setIsLoading(true);
          try {
            await loginWithGoogle(response.credential);
            toast.success("Login com Google realizado!");
            navigate("/onboarding");
          } catch (error: any) {
            const message = error.response?.data?.error || "Erro ao fazer login com Google.";
            toast.error(message);
          } finally {
            setIsLoading(false);
          }
        },
      });
      google.accounts.id.prompt();
    } else {
      toast.error("Google Sign-In não está disponível. Verifique sua conexão.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
            <Languages className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">PolyGlotFlow</span>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-muted-foreground">
              Entre na sua conta para continuar aprendendo
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-border/50 bg-background/50 hover:bg-accent/50 transition-all"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>

            <div className="relative">
              <Separator className="bg-border/50" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                ou
              </span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 bg-background/50 border-border/50 focus:border-primary/50 ${
                    errors.email ? "border-destructive" : ""
                  }`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={`h-12 bg-background/50 border-border/50 focus:border-primary/50 pr-12 ${
                      errors.senha ? "border-destructive" : ""
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-sm text-destructive">{errors.senha}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

// Google Sign-In types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
  const google: Window["google"];
}
