import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Rental, getAllRentals, approveRental, completeRental, cancelRental, deleteRental } from '@/services/rentalService';
import { TicketChat } from '@/components/TicketChat';
import { RentalDetailsCard } from '@/components/RentalDetailsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  Loader2,
  User,
  Package,
  Filter
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  active: { label: 'Ativo', color: 'bg-primary/20 text-primary border-primary/30' },
  completed: { label: 'Concluído', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function OrdersPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [filterItem, setFilterItem] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchRentals();
  }, [user, navigate]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const data = await getAllRentals();
      setRentals(data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rental: Rental) => {
    setActionLoading(rental.id);
    try {
      await approveRental(rental.id);
      toast({ title: 'Sucesso', description: 'Aluguel aprovado!' });
      fetchRentals();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (rental: Rental) => {
    setActionLoading(rental.id);
    try {
      await completeRental(rental.id);
      toast({ title: 'Sucesso', description: 'Aluguel finalizado!' });
      fetchRentals();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível finalizar', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (rental: Rental) => {
    setActionLoading(rental.id);
    try {
      await cancelRental(rental.id);
      toast({ title: 'Sucesso', description: 'Aluguel cancelado!' });
      fetchRentals();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível cancelar', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (rental: Rental) => {
    if (!confirm(`Tem certeza que deseja excluir o pedido #${String(rental.ticketNumber || 0).padStart(4, '0')}?`)) {
      return;
    }
    
    setActionLoading(rental.id);
    try {
      await deleteRental(rental.id);
      toast({ title: 'Sucesso', description: 'Pedido excluído!' });
      setSelectedRental(null);
      fetchRentals();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesItem = rental.itemName?.toLowerCase().includes(filterItem.toLowerCase());
    const matchesUser = rental.renterNickname.toLowerCase().includes(filterUser.toLowerCase());
    const matchesTab = activeTab === 'all' || rental.status === activeTab;
    return matchesItem && matchesUser && matchesTab;
  });

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
                <span className="text-primary neon-text">GESTÃO DE</span>
                <span className="text-foreground"> PEDIDOS</span>
              </h1>
              <p className="text-xs text-muted-foreground">Visualize e gerencie todos os tickets</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Filters and List */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Filters */}
            <div className="cyber-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="w-4 h-4" />
                Filtros
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por item..."
                  value={filterItem}
                  onChange={(e) => setFilterItem(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por usuário..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 bg-muted w-full">
                <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">Pendente</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Ativo</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Concluído</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Rentals List */}
            <ScrollArea className="flex-1 cyber-border rounded-lg">
              <div className="p-2 space-y-2">
                {filteredRentals.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum pedido encontrado
                  </div>
                ) : (
                  filteredRentals.map((rental) => {
                    const ticketNum = rental.ticketNumber || 0;
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">
                                #{String(ticketNum).padStart(4, '0')}
                              </span>
                              <Badge className={`text-[10px] ${statusConfig[rental.status].color}`}>
                                {statusConfig[rental.status].label}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm truncate mt-1">{rental.itemName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {rental.renterNickname}
                            </p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                              <span className="text-accent">{formatCurrency(rental.rentalCost || 0)}</span>
                              <span>•</span>
                              <span className="text-primary">{formatCurrency(rental.collateralAmount)}</span>
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
                  })
                )}
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
                  isAdmin={isAdmin}
                  actionLoading={actionLoading}
                  onApprove={handleApprove}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
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
                  <p>Selecione um pedido para ver os detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
