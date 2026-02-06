import { useState, useEffect } from 'react';
import { 
  Rental, 
  getAllRentals, 
  approveRental, 
  completeRental, 
  cancelRental,
  calculateRemainingTime 
} from '@/services/rentalService';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  XCircle, 
  PlayCircle,
  AlertTriangle,
  Timer
} from 'lucide-react';

function RentalTimer({ rental }: { rental: Rental }) {
  const [time, setTime] = useState(calculateRemainingTime(rental));

  useEffect(() => {
    if (rental.status !== 'active') return;

    const interval = setInterval(() => {
      setTime(calculateRemainingTime(rental));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [rental]);

  if (rental.status !== 'active') return null;

  if (time.expired) {
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expirado
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Timer className="w-4 h-4 text-primary" />
      <span className="text-foreground">
        {time.days}d {time.hours}h {time.minutes}m
      </span>
    </div>
  );
}

export function RentalsList() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const data = await getAllRentals();
      setRentals(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os aluguéis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleApprove = async (rental: Rental) => {
    try {
      setProcessingId(rental.id);
      await approveRental(rental.id);
      toast({
        title: "Pedido aprovado!",
        description: `O aluguel de ${rental.itemName} foi iniciado. Timer de ${rental.rentalDays} dias ativado.`,
      });
      fetchRentals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o pedido",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (rental: Rental) => {
    try {
      setProcessingId(rental.id);
      await completeRental(rental.id);
      toast({
        title: "Aluguel finalizado",
        description: `O aluguel de ${rental.itemName} foi encerrado.`,
      });
      fetchRentals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o aluguel",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (rental: Rental) => {
    try {
      setProcessingId(rental.id);
      await cancelRental(rental.id);
      toast({
        title: "Pedido cancelado",
        description: `O pedido de ${rental.itemName} foi cancelado.`,
      });
      fetchRentals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o pedido",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <PlayCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'credit': return 'Crédito';
      case 'trade': return 'Troca';
      default: return method;
    }
  };

  const pendingRentals = rentals.filter(r => r.status === 'pending');
  const activeRentals = rentals.filter(r => r.status === 'active');
  const completedRentals = rentals.filter(r => r.status === 'completed' || r.status === 'cancelled');

  const RentalsTable = ({ data, showTimer = false }: { data: Rental[], showTimer?: boolean }) => (
    <div className="cyber-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-cyber">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Ticket
              </TableHead>
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Item
              </TableHead>
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Locatário
              </TableHead>
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Período
              </TableHead>
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Custo / Colateral
              </TableHead>
              {showTimer && (
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                  Tempo Restante
                </TableHead>
              )}
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                Status
              </TableHead>
              <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-center">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={showTimer ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showTimer ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((rental) => (
                <TableRow key={rental.id} className="border-b border-border/30">
                  <TableCell>
                    <span className="font-mono text-sm">
                      #{String(rental.ticketNumber || 0).padStart(4, '0')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {rental.itemImageUrl && (
                        <img 
                          src={rental.itemImageUrl} 
                          alt={rental.itemName}
                          className="w-10 h-10 rounded object-cover border border-border"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{rental.itemName}</p>
                        {rental.items && rental.items.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            +{rental.items.length - 1} item(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{rental.renterNickname}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {rental.rentalDays} {rental.rentalDays === 1 ? 'dia' : 'dias'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({rental.rentalType === 'daily' ? 'Diário' : 'Semanal'})
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-mono text-accent">
                      {formatCurrency(rental.rentalCost || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Col: {formatCurrency(rental.collateralAmount)}
                    </p>
                  </TableCell>
                  {showTimer && (
                    <TableCell>
                      <RentalTimer rental={rental} />
                    </TableCell>
                  )}
                  <TableCell>
                    {getStatusBadge(rental.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {rental.status === 'pending' && (
                        <>
                          <Button 
                            variant="cyber" 
                            size="sm"
                            onClick={() => handleApprove(rental)}
                            disabled={processingId === rental.id}
                            className="gap-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Aprovar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCancel(rental)}
                            disabled={processingId === rental.id}
                            className="gap-1 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {rental.status === 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleComplete(rental)}
                          disabled={processingId === rental.id}
                          className="gap-1 hover:bg-green-500/20 hover:text-green-400"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-foreground">Pedidos e Aluguéis</h3>
          <p className="text-sm text-muted-foreground">
            {pendingRentals.length} pendentes • {activeRentals.length} ativos
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchRentals} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-yellow-500/20">
            <Clock className="w-4 h-4" />
            Pendentes ({pendingRentals.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary/20">
            <PlayCircle className="w-4 h-4" />
            Ativos ({activeRentals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-muted-foreground/20">
            <CheckCircle className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <RentalsTable data={pendingRentals} />
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <RentalsTable data={activeRentals} showTimer />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RentalsTable data={completedRentals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
