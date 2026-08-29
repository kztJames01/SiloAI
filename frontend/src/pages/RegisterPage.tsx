import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { Apple, Chrome } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { authApi } from '../lib/api';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get('oauth_code');
    if (!oauthCode) return;

    params.delete('oauth_code');
    const clean = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (clean ? `?${clean}` : ''));

    (async () => {
      try {
        setIsOAuthLoading(true);
        const response = await authApi.exchangeOAuthCode(oauthCode);
        await useAuthStore.getState().loginWithToken(response.data.token);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Social signup failed'));
      } finally {
        setIsOAuthLoading(false);
      }
    })();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    const url = authApi.oauthStartUrl(provider, 'register');
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo
            className="flex items-center justify-center gap-3 mb-4"
            imageClassName="h-16 w-auto"
            showText
            textClassName="text-3xl font-bold text-foreground dark:text-yellow-300"
          />
          <h1 className="text-3xl font-bold text-foreground">Join Silo</h1>
          <p className="text-muted-foreground mt-2">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Fill in your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={isLoading || isOAuthLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px bg-border flex-1"></div>
              <span>or continue with</span>
              <div className="h-px bg-border flex-1"></div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isOAuthLoading}
                onClick={() => handleSocialAuth('google')}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isOAuthLoading}
                onClick={() => handleSocialAuth('apple')}
              >
                <Apple className="h-4 w-4 mr-2" />
                Continue with Apple
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
