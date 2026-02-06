import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GameItem } from '@/types/gameItems';
import { getAllItems } from '@/services/itemService';
import { ItemsTable } from '@/components/ItemsTable';
import { RentalModal } from '@/components/RentalModal';
import { AdminPanel } from '@/components/AdminPanel';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Gamepad2, TrendingUp, Shield, LogIn, LogOut, User, Users, ShoppingBag, BookOpen, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { RulesModal } from '@/components/RulesModal';
import { getAllRentals } from '@/services/rentalService';

const Index = () => {
  const [items, setItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const { user, userProfile, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      // Keep empty array if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // fetch trades count
    (async () => {
      try {
        const rentals = await getAllRentals();
        const completed = rentals.filter(r => r.status === 'completed').length;
        setCompletedCount(completed);
      } catch (err) {
        console.error('Failed to fetch completed rentals count', err);
      }
    })();
  }, []);

  const handleRentSelected = () => {
    if (!user) {
      toast({
        title: t(lang, 'loginRequiredTitle'),
        description: t(lang, 'loginRequiredDesc'),
        variant: "destructive",
      });
      setAuthModalOpen(true);
      return;
    }
    if (selectedItemIds.length === 0) {
      toast({
        title: t(lang, 'noItemsSelectedTitle'),
        description: t(lang, 'noItemsSelectedDesc'),
        variant: "destructive",
      });
      return;
    }
    setModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t(lang, 'logoutSuccess'),
        description: 'Até a próxima!',
      });
    } catch (error) {
      toast({
        title: t(lang, 'error'),
        description: t(lang, 'logoutError'),
        variant: "destructive",
      });
    }
  };

  const handleRentalSuccess = () => {
    setModalOpen(false);
    setSelectedItemIds([]);
    fetchItems(); // Refresh items to update availability
  };

  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

  const availableCount = items.filter((i) => i.availability === 'available').length;

  const { lang, toggle, setLang } = useLanguage();

  return (
    <div className="min-h-screen bg-background cyber-gradient">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-glow">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="font-display text-xl font-bold tracking-wider flex items-center gap-3">
                    <span className="text-primary neon-text">GAME</span>
                    <span className="text-foreground">VAULT</span>
                    <div className="ml-2 flex items-center gap-2">
                      <button
                        aria-label="Português"
                        onClick={() => setLang('pt')}
                        className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${lang === 'pt' ? 'bg-green-600 text-white ring-2 ring-green-300' : ''}`}
                      >
                        🇧🇷
                      </button>
                      <button
                        aria-label="English"
                        onClick={() => setLang('en')}
                        className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${lang === 'en' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : ''}`}
                      >
                        🇬🇧
                      </button>
                    </div>
                  </h1>
                  <p className="text-xs text-muted-foreground">{t(lang, 'siteSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      {userProfile?.gameNickname || user.email}
                    </span>
                    {isAdmin && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="cyber-outline" 
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate('/my-orders')}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="hidden sm:inline">{t(lang, 'myOrders')}</span>
                  </Button>
                  <Button
                    variant="cyber-outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setRulesOpen(true)}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">{t(lang, 'rules')}</span>
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="cyber-outline" 
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate('/admin/orders')}
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">Pedidos</span>
                    </Button>
                  )}
                  {isAdmin && <AdminPanel />}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleLogout}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="cyber-outline" 
                  className="gap-2"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <LogIn className="w-4 h-4" />
                  {t(lang, 'login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="cyber-border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(lang, 'totalItems')}</p>
                <p className="text-2xl font-display font-bold text-foreground">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="cyber-border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(lang, 'availableRentals')}</p>
                <p className="text-2xl font-display font-bold text-primary neon-text">{availableCount}</p>
              </div>
            </div>
          </div>
          <div className="cyber-border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(lang, 'completedOrders')}</p>
                <p className="text-2xl font-display font-bold text-foreground">{completedCount !== null ? completedCount : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold tracking-wider text-foreground">
            {t(lang, 'availableRentals')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {user ? t(lang, 'availableRentalsSub') : t(lang, 'loginToRent')}
          </p>
        </div>

        {/* Items Table */}
        {loading ? (
          <div className="cyber-border rounded-lg p-8 text-center text-muted-foreground">
            {t(lang, 'loadingItems')}
          </div>
        ) : items.length === 0 ? (
          <div className="cyber-border rounded-lg p-8 text-center text-muted-foreground">
            {t(lang, 'noItems')}
          </div>
        ) : (
          <ItemsTable 
            items={items} 
            selectedIds={selectedItemIds}
            onSelectionChange={setSelectedItemIds}
            onRentSelected={handleRentSelected}
          />
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {t(lang, 'allTransactions')}
          </p>
        </div>

        <Footer />
      </main>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Rental Modal */}
      <RentalModal
        items={selectedItems}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRentalSuccess}
      />
      <RulesModal open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default Index;
