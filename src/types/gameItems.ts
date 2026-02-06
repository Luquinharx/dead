export interface GameItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  availability: 'available' | 'unavailable' | 'reserved';
  availableDays?: number;
  dailyRate: number;
  weeklyRate: number;
  marketRate: number;
  requiredCollateral: number;
  quantity: number;
  availableQuantity: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  value: number;
}

export type PaymentMethod = 'cash' | 'credit' | 'trade';
