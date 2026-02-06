import { useState } from 'react';
import { InventoryItem } from '@/types/gameItems';
import { ItemIcon } from './ItemIcon';
import { formatCurrency } from '@/utils/formatCurrency';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventorySelectorProps {
  items: InventoryItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function InventorySelector({ items, selectedIds, onSelectionChange }: InventorySelectorProps) {
  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-cyber pr-2">
      <p className="text-xs text-muted-foreground mb-3">
        Select items from your inventory to cover the collateral
      </p>
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
              "border",
              isSelected 
                ? "border-primary bg-primary/10 shadow-lg" 
                : "border-border bg-card hover:border-primary/50 hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              {item.imageUrl ? (
                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center",
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <ItemIcon category={item.category} className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className={cn(
                  "font-medium text-sm",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-mono text-sm font-semibold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {formatCurrency(item.value)}
              </span>
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-muted-foreground"
              )}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
