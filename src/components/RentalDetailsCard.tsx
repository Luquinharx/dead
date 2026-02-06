import { useState, useEffect } from 'react';
import { Rental, calculateRemainingTime } from '@/services/rentalService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Package,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Trash2,
  FileText,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

const statusConfig = {
  pending: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  active: { color: 'bg-primary/20 text-primary border-primary/30' },
  completed: { color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  cancelled: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const paymentIcons = {
  cash: Banknote,
  credit: CreditCard,
  trade: ArrowLeftRight,
};

interface RentalDetailsCardProps {
  rental: Rental;
  isAdmin?: boolean;
  showQueuePosition?: boolean;
  queuePosition?: number | null;
  actionLoading?: string | null;
  onApprove?: (rental: Rental) => void;
  onComplete?: (rental: Rental) => void;
  onCancel?: (rental: Rental) => void;
  onDelete?: (rental: Rental) => void;
}

export function RentalDetailsCard({
  rental,
  isAdmin = false,
  showQueuePosition = false,
  queuePosition = null,
  actionLoading = null,
  onApprove,
  onComplete,
  onCancel,
  onDelete,
}: RentalDetailsCardProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('details');
  const PaymentIcon = paymentIcons[rental.paymentMethod];

  const statusLabels: Record<string, string> = {
    pending: t(lang, 'statusPending'),
    active: t(lang, 'statusActive'),
    completed: t(lang, 'statusCompleted'),
    cancelled: t(lang, 'statusCancelled'),
  };

  // Calculate credits needed for credit payment (1 credit = 80k)
  const calculateCredits = (collateral: number) => {
    return Math.ceil(collateral / 80000);
  };

  return (
    <Card className="cyber-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Ticket #{String(rental.ticketNumber || 0).padStart(4, '0')}
          </span>
          <Badge className={statusConfig[rental.status].color}>
            {statusLabels[rental.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="details" className="gap-2 text-xs">
              <Package className="w-3 h-3" />
              {t(lang, 'details')}
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2 text-xs">
              <FileText className="w-3 h-3" />
              {t(lang, 'terms')}
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2 text-xs">
              <FileText className="w-3 h-3" />
              {t(lang, 'rules')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Queue Position for Pending */}
            {showQueuePosition && rental.status === 'pending' && queuePosition && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {t(lang, 'queuePosition')}: <strong className="text-yellow-500">{queuePosition}º</strong>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(lang, 'awaitingApproval')}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'itemLabel')}</span>
                <p className="font-medium">{rental.itemName}</p>
                {rental.items && rental.items.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {rental.items.map((item, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        • {item.itemName} (x{item.quantity})
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'userLabel')}</span>
                <p className="font-medium">{rental.renterNickname}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'paymentMethodLabel')}</span>
                <div className="flex items-center gap-2">
                  <PaymentIcon className="w-4 h-4 text-primary" />
                  <span className="capitalize">{t(lang, `payment_${rental.paymentMethod}`) ?? rental.paymentMethod}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'period')}</span>
                <p className="font-medium">{rental.rentalDays} {t(lang, 'days')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'rentalCost')}</span>
                <p className="font-mono font-bold text-accent">
                  {formatCurrency(rental.rentalCost || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{t(lang, 'collateral')}</span>
                <p className="font-mono font-bold text-primary">
                  {formatCurrency(rental.collateralAmount)}
                </p>
              </div>
              {rental.deliveryLocation && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t(lang, 'deliveryLocation')}
                  </span>
                  <p className="font-medium">{rental.deliveryLocation}</p>
                </div>
              )}
              {rental.paymentMethod === 'credit' && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t(lang, 'creditsNeededTitle')}</span>
                  <p className="font-mono font-bold text-accent">
                    {calculateCredits(rental.collateralAmount)} créditos
                  </p>
                    <p className="text-xs text-muted-foreground">
                      ({t(lang, 'conversionRate')})
                    </p>
                </div>
              )}
            </div>

            {/* Collateral Items (for trade) */}
            {rental.collateralItems && rental.collateralItems.length > 0 && (
              <div className="border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">{t(lang, 'collateralItems')}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rental.collateralItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-6 h-6 rounded object-cover" />
                      )}
                      <span className="text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remaining Time for Active Rentals */}
            {rental.status === 'active' && (
              <div className="border-t border-border pt-4">
                <RemainingTimeDisplay rental={rental} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="terms" className="mt-4 space-y-4">
            {rental.termsText ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{t(lang, 'termsAcceptedByUser')}</span>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <p className="font-semibold">{t(lang, 'rentTerms_notice_title')}</p>
                    </div>

                    <div className="space-y-2">
                      <p>{t(lang, 'rentTerms_paragraph1')}</p>
                      <p>{t(lang, 'rentTerms_paragraph2')}</p>
                      <p>{t(lang, 'rentTerms_paragraph3')}</p>
                      <p>{t(lang, 'rentTerms_paragraph4')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t(lang, 'noTermsRegistered')}</p>
                <p className="text-xs mt-1">{t(lang, 'oldOrdersMayNotHaveTerms')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-4">
            <div className="space-y-6">
              <div className="bg-gray-800 text-white rounded-md py-3 px-4 text-center font-bold text-lg">
                {t(lang, 'rentalStartProcess')}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t(lang, 'page13Transfer')}</p>
                  <h4 className="font-semibold mt-2">{t(lang, 'ruleStart1Title')}</h4>
                  <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                    <li>{t(lang, 'ruleStart1Desc1')}</li>
                    <li>{t(lang, 'ruleStart1Desc2')}</li>
                  </ul>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t(lang, 'page12Collateral')}</p>
                  <h4 className="font-semibold mt-2">{t(lang, 'ruleStart2Title')}</h4>
                  <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                    <li>{t(lang, 'ruleStart2Desc1')}</li>
                    <li>{t(lang, 'ruleStart2Desc2')}</li>
                  </ul>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t(lang, 'page11Armoury')}</p>
                  <h4 className="font-semibold mt-2">{t(lang, 'ruleStart3Title')}</h4>
                  <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                    <li>{t(lang, 'ruleStart3Desc1')}</li>
                    <li>{t(lang, 'ruleStart3Desc2')}</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-800 text-white rounded-md py-3 px-4 text-center font-bold text-lg">
                {t(lang, 'rentalReturnProcess')}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold">{t(lang, 'ruleReturn1Title')}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{t(lang, 'ruleReturn1Desc')}</p>
                </div>
                <div>
                  <h4 className="font-semibold">{t(lang, 'ruleReturn2Title')}</h4>
                  <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                    <li>{t(lang, 'ruleReturn2Desc1')}</li>
                    <li>{t(lang, 'ruleReturn2Desc2')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">{t(lang, 'ruleReturn3Title')}</h4>
                  <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                    <li>{t(lang, 'ruleReturn3Desc1')}</li>
                    <li>{t(lang, 'ruleReturn3Desc2')}</li>
                    <li>{t(lang, 'ruleReturn3Desc3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <div className="flex gap-2">
              {rental.status === 'pending' && onApprove && onCancel && (
                <>
                  <Button
                    variant="cyber"
                    onClick={() => onApprove(rental)}
                    disabled={actionLoading === rental.id}
                    className="flex-1"
                  >
                    {actionLoading === rental.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onCancel(rental)}
                    disabled={actionLoading === rental.id}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
              {rental.status === 'active' && onComplete && (
                <Button
                  variant="cyber"
                  onClick={() => onComplete(rental)}
                  disabled={actionLoading === rental.id}
                  className="flex-1"
                >
                  {actionLoading === rental.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizar
                    </>
                  )}
                </Button>
              )}
              {/* If expired within 24h show admin quick return button */}
              {rental.status === 'active' && onComplete && (
                (() => {
                  const approvedAt = rental.approvedAt?.toDate?.();
                  if (!approvedAt) return null;
                  const endDate = new Date(approvedAt);
                  endDate.setDate(endDate.getDate() + rental.rentalDays);
                  const now = new Date();
                  const ms24 = 24 * 60 * 60 * 1000;
                  if (now > endDate && (now.getTime() - endDate.getTime()) <= ms24) {
                    return (
                      <Button
                        variant="outline"
                        onClick={() => onComplete(rental)}
                        disabled={actionLoading === rental.id}
                        className="flex-1"
                      >
                        Marcar Devolvido
                      </Button>
                    );
                  }
                  return null;
                })()
              )}
            </div>
            
            {/* Delete Button - always visible for admins */}
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(rental)}
                disabled={actionLoading === rental.id}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Pedido
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RemainingTimeDisplay({ rental }: { rental: Rental }) {
  const [time, setTime] = useState(calculateRemainingTime(rental));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculateRemainingTime(rental));
    }, 60000);
    return () => clearInterval(interval);
  }, [rental]);

  // Compute endDate to support 24h grace period
  const approvedAt = rental.approvedAt?.toDate?.();
  const endDate = approvedAt ? new Date(approvedAt) : null;
  if (endDate) endDate.setDate(endDate.getDate() + rental.rentalDays);

  const now = new Date();
  let within24hWarning = false;
  let hoursLeftToReturn = 0;
  if (endDate && now > endDate) {
    const overdueMs = now.getTime() - endDate.getTime();
    const ms24 = 24 * 60 * 60 * 1000;
    if (overdueMs <= ms24) {
      within24hWarning = true;
      hoursLeftToReturn = Math.max(0, Math.ceil((ms24 - overdueMs) / (1000 * 60 * 60)));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-primary" />
      <span className="text-sm text-muted-foreground">Tempo Restante:</span>
      {!time.expired ? (
        <span className="font-mono text-sm">
          {time.days}d {time.hours}h {time.minutes}m
        </span>
      ) : within24hWarning ? (
        <span className="text-sm font-medium text-red-500">
          Vencido — Faltam {hoursLeftToReturn}h para devolver (alerta 24h)
        </span>
      ) : (
        <span className="text-sm font-medium text-destructive">Expirado</span>
      )}
    </div>
  );
}
