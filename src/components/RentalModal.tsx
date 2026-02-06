import { useState, useMemo, useEffect } from 'react';
import { GameItem, PaymentMethod, InventoryItem } from '@/types/gameItems';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemIcon } from './ItemIcon';
import { CollateralProgress } from './CollateralProgress';
import { InventorySelector } from './InventorySelector';
import { formatCurrency } from '@/utils/formatCurrency';
import { CreditCard, Banknote, ArrowLeftRight, AlertCircle, Loader2, Info, MapPin, AlertTriangle, Shield, Lock } from 'lucide-react';
import { getAllItems } from '@/services/itemService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createRental, DeliveryLocation } from '@/services/rentalService';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface RentalModalProps {
  items: GameItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RentalModal({ items, open, onOpenChange, onSuccess }: RentalModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [rentalDays, setRentalDays] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [collateralItems, setCollateralItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>('Camp Valcrest');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState<'details' | 'terms'>('details');
  const { lang } = useLanguage();
  const [guaranteeSettings, setGuaranteeSettings] = useState<{cash: boolean, credit: boolean, items: boolean}>({
    cash: true, credit: true, items: true
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('guarantee_settings_v2'); // Match new key
      if (saved) {
        setGuaranteeSettings(JSON.parse(saved));
      }
    } catch (e) { console.error(e); }
  }, [open]); // Refresh when opening

  // Check if ANY method is available
  const isAnyMethodAvailable = guaranteeSettings.cash || guaranteeSettings.credit || guaranteeSettings.items;

  // Set initial payment method based on availability
  useEffect(() => {
    if (guaranteeSettings.cash) setPaymentMethod('cash');
    else if (guaranteeSettings.credit) setPaymentMethod('credit');
    else if (guaranteeSettings.items) setPaymentMethod('trade');
  }, [guaranteeSettings]);

  const TERMS_TEXT = `AVISO IMPORTANTE — SEGURANÇA DOS ITENS DO CLÃ

Todos os itens disponibilizados pelo clã estão protegidos pelas regras oficiais do jogo.

Qualquer tentativa de roubo, fraude ou recusa em devolver um item alugado será considerada uma violação grave das regras.

Consequências:

- Sua conta poderá ser permanentemente banida pelos administradores do jogo.
- O(s) item(ns) poderá(ão) ser automaticamente recuperado(s) e estornado(s) ao clã.
- Todas as movimentações ficam registradas e documentadas para auditoria.

Não vale o risco. Qualquer tentativa de abuso resultará em punições severas e irreversíveis.

Use o sistema corretamente, respeite as regras e ajude a manter o clã seguro e organizado para todos.`;

  // Reset quantities when items change
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    items.forEach(item => {
      initialQuantities[item.id] = 1;
    });
    setQuantities(initialQuantities);
  }, [items.map(i => i.id).join(',')]);

  // Fetch items for collateral when modal opens
  useEffect(() => {
    if (open && paymentMethod === 'trade') {
      fetchCollateralItems();
    }
  }, [open, paymentMethod]);

  // Reset terms when modal opens
  useEffect(() => {
    if (open) {
      setTermsAccepted(false);
    }
  }, [open]);

  const fetchCollateralItems = async () => {
    setLoadingItems(true);
    try {
      const allItems = await getAllItems();
      // Convert GameItems to InventoryItems for collateral selection (use marketRate as value)
      // Exclude items being rented
      const rentingItemIds = items.map(i => i.id);
      const inventoryItems: InventoryItem[] = allItems
        .filter(item => !rentingItemIds.includes(item.id))
        .map((gameItem) => ({
          id: gameItem.id,
          name: gameItem.name,
          category: gameItem.category,
          imageUrl: gameItem.imageUrl,
          value: gameItem.marketRate,
        }));
      setCollateralItems(inventoryItems);
    } catch (error) {
      console.error('Error fetching collateral items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectedInventoryItems = useMemo(() => {
    return collateralItems.filter((inv) => selectedInventoryIds.includes(inv.id));
  }, [selectedInventoryIds, collateralItems]);

  const selectedInventoryValue = useMemo(() => {
    return selectedInventoryItems.reduce((sum, inv) => sum + inv.value, 0);
  }, [selectedInventoryItems]);

  // Calculate total collateral for all items
  const totalCollateral = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = quantities[item.id] || 1;
      const price = item.marketRate ?? item.value ?? 0;
      const collateralPerUnit = Math.floor(price * 0.8); // 80% of value
      return sum + collateralPerUnit * qty;
    }, 0);
  }, [items, quantities]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = quantities[item.id] || 1;
      const price = item.marketRate ?? item.value ?? 0;
      const dailyPerUnit = Math.floor(price * 0.02); // 2% per day
      const weeklyPerDayPerUnit = Math.floor(price * 0.015); // 1.5% per day for weekly
      const rate = rentalDays <= 6 ? dailyPerUnit * rentalDays : weeklyPerDayPerUnit * rentalDays;
      return sum + rate * qty;
    }, 0);
  }, [items, quantities, rentalDays]);

  // Calculate credits needed (1 credit = 80k)
  const creditsNeeded = useMemo(() => {
    // totalCollateral is in raw value, 1 credit = 80,000
    // credits = totalCollateral / 80,000 (rounded up, no decimals)
    return Math.ceil(totalCollateral / 80000);
  }, [totalCollateral]);

  // Use updated TERMS_TEXT
  const termsText = TERMS_TEXT;

  const canConfirm = useMemo(() => {
    if (items.length === 0) return false;
    if (!termsAccepted) return false;
    // Check all quantities are valid
    for (const item of items) {
      const qty = quantities[item.id] || 1;
      const maxQty = item.availableQuantity ?? item.quantity ?? 1;
      if (qty > maxQty) return false;
    }
    if (paymentMethod === 'trade') {
      return selectedInventoryValue >= totalCollateral;
    }
    return true;
  }, [paymentMethod, selectedInventoryValue, items, quantities, totalCollateral, termsAccepted]);

  const canProceedFromDetails = useMemo(() => {
    if (items.length === 0) return false;
    // Check quantities valid
    for (const item of items) {
      const qty = quantities[item.id] || 1;
      const maxQty = item.availableQuantity ?? item.quantity ?? 1;
      if (qty > maxQty) return false;
    }
    if (paymentMethod === 'trade') {
      return selectedInventoryValue >= totalCollateral;
    }
    return true;
  }, [items, quantities, paymentMethod, selectedInventoryValue, totalCollateral]);

  const handleQuantityChange = (itemId: string, value: number, max: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.min(max, Math.max(1, value))
    }));
  };

  const handleDaysChange = (value: number) => {
    // Max 7 days
    setRentalDays(Math.min(7, Math.max(1, value)));
  };

  const handleConfirm = async () => {
    if (items.length === 0 || !user || !userProfile) return;
    
    setLoading(true);
    
    try {
      const rentalType = rentalDays > 6 ? 'weekly' : 'daily';
      
      // Create a single rental with all items
      await createRental(
        items,
        quantities,
        user.uid,
        userProfile.gameNickname,
        paymentMethod,
        rentalType,
        rentalDays,
        deliveryLocation,
        termsText,
        paymentMethod === 'trade' ? selectedInventoryItems : undefined
      );
      
      toast({
        title: t(lang, 'orderSentTitle'),
        description: t(lang, 'orderSentDesc'),
      });
      
      setSelectedInventoryIds([]);
      setRentalDays(1);
      setTermsAccepted(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t(lang, 'error'),
        description: error.message || t(lang, 'orderSendErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedInventoryIds([]);
    setRentalDays(1);
    setQuantities({});
    setTermsAccepted(false);
    onOpenChange(false);
  };

  if (items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border cyber-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t(lang, 'rentVerb')} {items.length} {items.length > 1 ? t(lang, 'items') : t(lang, 'item')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t(lang, 'rentDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!isAnyMethodAvailable ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
               <AlertCircle className="w-12 h-12 text-muted-foreground" />
               <h3 className="text-lg font-medium">{t(lang, 'rentalsUnavailable')}</h3>
               <p className="text-sm text-muted-foreground">{t(lang, 'rentalsUnavailableDesc')}</p>
            </div>
          ) : step === 'details' && (
            <>
              {/* Items List */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {items.map((item) => {
                  const maxQty = item.availableQuantity ?? item.quantity ?? 1;
                  const qty = quantities[item.id] || 1;
                  return (
                    <div key={item.id} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center text-primary overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ItemIcon category={item.category} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.requiredCollateral)} {t(lang, 'collateralPerUnit')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={maxQty}
                          value={qty}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, maxQty)}
                          className="w-14 h-8 text-center font-mono bg-card text-sm"
                        />
                        <span className="text-xs text-muted-foreground">/{maxQty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t(lang, 'period')}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={rentalDays}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-center font-mono bg-card"
                    />
                    <span className="text-sm text-muted-foreground">{t(lang, 'daysMax')}</span>
                  </div>
                </div>
                
                {/* Delivery Location */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t(lang, 'deliveryLocation')}
                  </span>
                  <Select value={deliveryLocation} onValueChange={(v) => setDeliveryLocation(v as DeliveryLocation)}>
                    <SelectTrigger className="w-[180px] h-8 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camp Valcrest">{t(lang, 'campValcrest')}</SelectItem>
                      <SelectItem value="Outpost">{t(lang, 'outpost')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t(lang, 'totalRentalCost')}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">{t(lang, 'totalCollateral')}</span>
                  <span className="font-mono font-bold text-primary neon-text">
                    {formatCurrency(totalCollateral)}
                  </span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              {!isAnyMethodAvailable ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed my-4">
                  <p>{t(lang, 'rentalsUnavailable')}</p>
                </div>
              ) : (
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <TabsList className="grid grid-cols-3 bg-muted">
                  {guaranteeSettings.cash && (
                    <TabsTrigger value="cash" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Banknote className="w-4 h-4" />
                      {t(lang, 'cashLabel')}
                    </TabsTrigger>
                  )}
                  {guaranteeSettings.credit && (
                    <TabsTrigger value="credit" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <CreditCard className="w-4 h-4" />
                      {t(lang, 'creditLabel')}
                    </TabsTrigger>
                  )}
                  {guaranteeSettings.items && (
                  <TabsTrigger value="trade" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ArrowLeftRight className="w-4 h-4" />
                    {t(lang, 'tradeLabel')}
                  </TabsTrigger>
                  )}
                </TabsList>


                {guaranteeSettings.cash && (
                <TabsContent value="cash" className="mt-4 space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{t(lang, 'paymentCashTitle')}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(lang, 'paymentCashDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                )}

                {guaranteeSettings.credit && (
                <TabsContent value="credit" className="mt-4 space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t(lang, 'creditLineTitle')}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(lang, 'creditLineDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credits Calculation */}
                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-accent">{t(lang, 'creditsNeededTitle')}</p>
                        <p className="text-2xl font-mono font-bold text-accent mt-1">
                          {creditsNeeded} créditos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(lang, 'conversionRate')}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                )}


                {guaranteeSettings.items && (
                <TabsContent value="trade" className="mt-4 space-y-4">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <InventorySelector
                        items={collateralItems}
                        selectedIds={selectedInventoryIds}
                        onSelectionChange={setSelectedInventoryIds}
                      />
                      <CollateralProgress
                        current={selectedInventoryValue}
                        required={totalCollateral}
                      />
                    </>
                  )}
                </TabsContent>
                )}
              </Tabs>
              )}

              {/* Warning for insufficient collateral */}
              {guaranteeSettings.items && paymentMethod === 'trade' && selectedInventoryValue < totalCollateral && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t(lang, 'selectMoreCollateral')}</span>
                </div>
              )}
            </>
          )}

          {/* Step navigation */}
          {!isAnyMethodAvailable ? (
             <Button variant="outline" onClick={handleClose} className="w-full">{t(lang, 'back')}</Button>
          ) : step === 'details' ? (
            <div className="flex gap-2">
              <div className="flex-1">
                  <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleClose}
                >
                  {t(lang, 'cancel')}
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  variant="cyber"
                  size="lg"
                  className="w-full"
                  disabled={!canProceedFromDetails}
                  onClick={() => setStep('terms')}
                >
                  {t(lang, 'nextTerms')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Terms Agreement */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <Label className="font-medium">{t(lang, 'rentTerms_title')}</Label>
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

                  {/* Automatic calculation summary per item - removed percent breakdown from terms but kept this for transparency */}
                  <div className="bg-muted/20 rounded-lg p-3 border border-border">
                    <div className="space-y-2">
                      {items.map(item => {
                        const price = item.marketRate ?? item.value ?? 0;
                        const qty = quantities[item.id] || 1;
                        const daily = Math.floor(price * 0.02);
                        const weeklyPerDay = Math.floor(price * 0.015);
                        const collateralReq = Math.floor(price * 0.8);
                        return (
                          <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.name} x{qty}</p>
                              <p className="text-xs text-muted-foreground">
                                {t(lang, 'priceLabel')}: {formatCurrency(price)}
                              </p>
                            </div>
                            <div className="text-right text-xs sm:text-sm">
                              <div>{t(lang, 'calculatedDailyRent')}: <span className="font-mono text-foreground">{formatCurrency(daily)} {t(lang, 'days')}</span></div>
                              <div>{t(lang, 'calculatedWeeklyRent')}: <span className="font-mono text-foreground">{formatCurrency(weeklyPerDay)} {t(lang, 'days')}</span></div>
                              <div>{t(lang, 'calculatedCollateral')}: <span className="font-mono text-foreground">{formatCurrency(collateralReq)}</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                    {t(lang, 'termsAgree')}
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Button variant="outline" size="lg" className="w-full" onClick={() => setStep('details')}>
                    {t(lang, 'back')}
                  </Button>
                </div>
                <div className="flex-1">
                  <Button
                    variant="cyber"
                    size="lg"
                    className="w-full"
                    disabled={!canConfirm || loading}
                    onClick={handleConfirm}
                  >
                    {loading ? t(lang, 'sending') : t(lang, 'sendOrder')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
