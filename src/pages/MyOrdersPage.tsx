import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Rental, getUserRentals } from '@/services/rentalService';
import { TicketChat } from '@/components/TicketChat';
import { RentalDetailsCard } from '@/components/RentalDetailsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  ArrowLeft, 
  Loader2,
  Package,
  Hash
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

const statusConfig = {
  pending: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  active: { color: 'bg-primary/20 text-primary border-primary/30' },
  completed: { color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  cancelled: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function MyOrdersPage() {
  const { lang } = useLanguage();
  const statusLabels: Record<string, string> = {
    pending: t(lang, 'statusPending'),
    active: t(lang, 'statusActive'),
    completed: t(lang, 'statusCompleted'),
    cancelled: t(lang, 'statusCancelled'),
  };
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchRentals();
  }, [user, navigate]);

  const fetchRentals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserRentals(user.uid);
      setRentals(data);
      if (data.length > 0) {
        setSelectedRental(data[0]);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate queue position for pending rentals
  const getQueuePosition = (rental: Rental) => {
    const pendingRentals = rentals.filter(r => r.status === 'pending');
    const index = pendingRentals.findIndex(r => r.id === rental.id);
    return index >= 0 ? index + 1 : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-gradient">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">
                {t(lang, 'myOrders')}
              </h1>
              <p className="text-xs text-muted-foreground">{t(lang, 'followYourRentals')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        {rentals.length === 0 ? (
          <div className="cyber-border rounded-lg p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t(lang, 'noOrdersYet')}</p>
            <Button variant="cyber" className="mt-4" onClick={() => navigate('/')}>
              {t(lang, 'viewAvailableItems')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
            {/* Left Panel - Orders List */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <ScrollArea className="flex-1 cyber-border rounded-lg">
                <div className="p-2 space-y-2">
                  {rentals.map((rental) => {
                    const queuePosition = getQueuePosition(rental);
                    const ticketNum = rental.ticketNumber || rentals.indexOf(rental) + 1;
                    return (
                      <div
                        key={rental.id}
                        onClick={() => setSelectedRental(rental)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedRental?.id === rental.id
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-muted/30 border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {String(ticketNum).padStart(4, '0')}
                              </span>
                              <Badge className={`text-[10px] ${statusConfig[rental.status].color}`}>
                                {statusLabels[rental.status]}
                              </Badge>
                              {queuePosition && (
                                <Badge variant="outline" className="text-[10px]">
                                  {t(lang, 'queueLabel')}: {queuePosition}º
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm truncate mt-1">{rental.itemName}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{rental.rentalDays} {t(lang, 'days')}</span>
                              <span>•</span>
                              <span className="text-primary">{formatCurrency(rental.rentalCost || 0)}</span>
                            </div>
                          </div>
                          {rental.itemImageUrl && (
                            <img 
                              src={rental.itemImageUrl} 
                              alt={rental.itemName}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Details and Chat */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {selectedRental ? (
                <>
                  {/* Ticket Details */}
                  <RentalDetailsCard
                    rental={selectedRental}
                    showQueuePosition={true}
                    queuePosition={getQueuePosition(selectedRental)}
                  />

                  {/* Chat */}
                  <div className="flex-1 cyber-border rounded-lg overflow-hidden min-h-[300px]">
                    <TicketChat rentalId={selectedRental.id} />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center cyber-border rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t(lang, 'selectOrderToSeeDetails')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
