import { GameItem } from '@/types/gameItems';
import { ItemIcon } from './ItemIcon';
import { AvailabilityBadge } from './AvailabilityBadge';
import { formatCurrency } from '@/utils/formatCurrency';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ItemsTableProps {
  items: GameItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRentSelected: () => void;
}

export function ItemsTable({ items, selectedIds, onSelectionChange, onRentSelected }: ItemsTableProps) {
  const { lang } = useLanguage();
  // Item is available if availableQuantity > 0
  const availableItems = items.filter(i => (i.availableQuantity ?? i.quantity ?? 1) > 0);
  const allAvailableSelected = availableItems.length > 0 && 
    availableItems.every(item => selectedIds.includes(item.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(availableItems.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, itemId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== itemId));
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-3">
          <span className="text-sm">
            <strong className="text-primary">{selectedIds.length}</strong> {t(lang, 'selectedItems')}
          </span>
          <Button variant="cyber" size="sm" onClick={onRentSelected} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            {t(lang, 'rentSelected')}
          </Button>
        </div>
      )}

      <div className="cyber-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-cyber">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allAvailableSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={t(lang, 'selectAllAria')}
                  />
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                  {t(lang, 'itemsHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-center">
                  {t(lang, 'qtyHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                  {t(lang, 'availabilityHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-right">
                  {t(lang, 'dailyRateHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-right">
                  {t(lang, 'weeklyRateHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-right">
                  {t(lang, 'marketRateHeader')}
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-right">
                  {t(lang, 'requiredCollateralHeader')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {items.map((item) => {
                const availableQty = item.availableQuantity ?? item.quantity ?? 1;
                const isAvailable = availableQty > 0;
                const isSelected = selectedIds.includes(item.id);
                
                return (
                  <TableRow
                    key={item.id}
                    className={`table-row-hover border-b border-border/30 ${isAvailable ? 'cursor-pointer' : 'opacity-60'} ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => isAvailable && handleSelectItem(item.id, !isSelected)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        disabled={!isAvailable}
                        aria-label={t(lang, 'selectItemAria').replace('{name}', item.name)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        {item.imageUrl ? (
                          <div className="w-24 h-14 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0 border border-border/50 flex items-center justify-center p-1">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-primary"><svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>`;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-muted flex items-center justify-center text-primary flex-shrink-0 border border-border/50">
                            <ItemIcon category={item.category} className="w-7 h-7" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {item.availableQuantity ?? item.quantity ?? 1}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        /{item.quantity ?? 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AvailabilityBadge
                        availability={availableQty > 0 ? 'available' : 'unavailable'}
                        availableDays={item.availableDays}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(Math.floor((item.marketRate ?? item.value ?? 0) * 0.02))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(Math.floor((item.marketRate ?? item.value ?? 0) * 0.015 * 7))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.marketRate ?? item.value ?? 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary font-semibold">
                      {formatCurrency(Math.floor((item.marketRate ?? item.value ?? 0) * 0.8))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
