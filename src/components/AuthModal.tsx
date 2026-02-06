import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Crown, Mail, Lock, User, ExternalLink, Hash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gameNickname, setGameNickname] = useState('');
  const [gameId, setGameId] = useState('');
  const [dfProfilerUrl, setDfProfilerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  
  const { signIn, signUp, checkNicknameAvailable } = useAuth();
  const { toast } = useToast();
  const { lang } = useLanguage();

  const handleNicknameBlur = async () => {
    if (gameNickname.length >= 3) {
      const available = await checkNicknameAvailable(gameNickname);
      if (!available) {
        setNicknameError(t(lang, 'nicknameInUse'));
      } else {
        setNicknameError('');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: t(lang, 'loginSuccessTitle'),
        description: t(lang, 'loginSuccessDesc'),
      });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: t(lang, 'loginErrorTitle'),
        description: error.message || t(lang, 'loginErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (gameNickname.length < 3) {
      toast({
        title: t(lang, 'error'),
        description: t(lang, 'nicknameTooShort'),
        variant: "destructive",
      });
      return;
    }

    if (!gameId.trim()) {
      toast({
        title: t(lang, 'error'),
        description: t(lang, 'gameIdRequired'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t(lang, 'error'),
        description: t(lang, 'passwordsDoNotMatch'),
        variant: "destructive",
      });
      return;
    }

    if (nicknameError) {
      toast({
        title: "Erro",
        description: nicknameError,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password, gameNickname, gameId, dfProfilerUrl || undefined);
      toast({
        title: t(lang, 'accountCreatedTitle'),
        description: t(lang, 'accountCreatedDesc'),
      });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: t(lang, 'registerErrorTitle'),
        description: error.message || t(lang, 'registerErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setGameNickname('');
    setGameId('');
    setDfProfilerUrl('');
    setNicknameError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Crown className="w-6 h-6 text-primary" />
            <div className="flex items-center gap-1 animate-fail-glitch font-camp text-grunge tracking-widest">
                <span className="text-primary neon-text">KINGCROWN</span>
                <span className="text-foreground">VAULT</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="login" className="gap-2 data-[state=active]:bg-primary/20">
              <LogIn className="w-4 h-4" />
                  {t(lang, 'login')}
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2 data-[state=active]:bg-primary/20">
              <UserPlus className="w-4 h-4" />
                  {t(lang, 'register')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  {t(lang, 'email')}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(lang, 'emailPlaceholder')}
                  className="bg-muted border-border"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  {t(lang, 'password')}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border"
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="cyber" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? t(lang, 'signingIn') : t(lang, 'signIn')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  {t(lang, 'email')}
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-muted border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-nickname" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {t(lang, 'gameNickname')}
                </Label>
                <Input
                  id="register-nickname"
                  type="text"
                  value={gameNickname}
                  onChange={(e) => {
                    setGameNickname(e.target.value);
                    setNicknameError('');
                  }}
                  onBlur={handleNicknameBlur}
                  placeholder={t(lang, 'nicknamePlaceholder')}
                  className={`bg-muted border-border ${nicknameError ? 'border-destructive' : ''}`}
                  minLength={3}
                  required
                />
                {nicknameError && (
                  <p className="text-xs text-destructive">{nicknameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t(lang, 'oneAccountPerNickname')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-game-id" className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  {t(lang, 'gameId')}
                </Label>
                <Input
                  id="register-game-id"
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder={t(lang, 'gameIdPlaceholder')}
                  className="bg-muted border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-dfprofiler" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  DFProfiler (opcional)
                </Label>
                  <Input
                  id="register-dfprofiler"
                  type="text"
                  value={dfProfilerUrl}
                  onChange={(e) => setDfProfilerUrl(e.target.value)}
                  placeholder={t(lang, 'dfProfilerPlaceholder')}
                  className="bg-muted border-border"
                />
                <a 
                  href="https://www.dfprofiler.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t(lang, 'getDfProfilerId')}
                </a>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  {t(lang, 'password')}
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  {t(lang, 'confirmPassword')}
                </Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`bg-muted border-border ${confirmPassword && password !== confirmPassword ? 'border-destructive' : ''}`}
                  minLength={6}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">{t(lang, 'passwordsDoNotMatch')}</p>
                )}
              </div>

              <Button 
                type="submit" 
                variant="cyber" 
                className="w-full" 
                disabled={loading || !!nicknameError || (!!confirmPassword && password !== confirmPassword)}
              >
                {loading ? t(lang, 'creatingAccount') : t(lang, 'createAccount')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
