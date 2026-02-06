import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameItem, InventoryItem } from '@/types/gameItems';

const RENTALS_COLLECTION = 'rentals';
const COUNTERS_COLLECTION = 'counters';

export type RentalStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface RentalItem {
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  quantity: number;
  dailyRate: number;
  weeklyRate: number;
  collateralAmount: number;
}

export type DeliveryLocation = 'Camp Valcrest' | 'Outpost';

export interface Rental {
  id: string;
  ticketNumber: number;
  items: RentalItem[];
  // Legacy single item fields for backwards compatibility
  itemId?: string;
  itemName?: string;
  itemImageUrl?: string;
  renterId: string;
  renterNickname: string;
  ownerId: string;
  paymentMethod: 'cash' | 'credit' | 'trade';
  collateralAmount: number;
  collateralItems?: InventoryItem[];
  rentalCost: number;
  dailyRate?: number;
  weeklyRate?: number;
  rentalType: 'daily' | 'weekly';
  rentalDays: number;
  deliveryLocation: DeliveryLocation;
  termsAccepted: boolean;
  termsText: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  approvedAt?: Timestamp;
  status: RentalStatus;
  createdAt: Timestamp;
}

async function getNextTicketNumber(): Promise<number> {
  const counterRef = doc(db, COUNTERS_COLLECTION, 'rentals');
  
  try {
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await setDoc(counterRef, { lastTicketNumber: 1 });
      return 1;
    }
    
    const currentNumber = counterDoc.data().lastTicketNumber || 0;
    const nextNumber = currentNumber + 1;
    
    await updateDoc(counterRef, { lastTicketNumber: nextNumber });
    return nextNumber;
  } catch (error) {
    console.error('Error getting ticket number:', error);
    return Date.now(); // Fallback to timestamp
  }
}

export async function createRental(
  items: GameItem[],
  quantities: Record<string, number>,
  renterId: string,
  renterNickname: string,
  paymentMethod: 'cash' | 'credit' | 'trade',
  rentalType: 'daily' | 'weekly',
  rentalDays: number,
  deliveryLocation: DeliveryLocation,
  termsText: string,
  collateralItems?: InventoryItem[]
): Promise<string> {
  const ticketNumber = await getNextTicketNumber();
  
  // Calculate totals
  let totalCollateral = 0;
  let totalRentalCost = 0;
  
  const rentalItems: RentalItem[] = items.map(item => {
    const qty = quantities[item.id] || 1;
    const collateral = item.requiredCollateral * qty;
    const rate = rentalDays <= 6 ? item.dailyRate * rentalDays : item.weeklyRate;
    const cost = rate * qty;
    
    totalCollateral += collateral;
    totalRentalCost += cost;
    
    return {
      itemId: item.id,
      itemName: item.name,
      itemImageUrl: item.imageUrl || undefined,
      quantity: qty,
      dailyRate: item.dailyRate,
      weeklyRate: item.weeklyRate,
      collateralAmount: collateral,
    };
  });

  const rental = {
    ticketNumber,
    items: rentalItems,
    // For backwards compatibility and quick display
    itemId: items[0].id,
    itemName: items.length > 1 ? `${items[0].name} +${items.length - 1}` : items[0].name,
    itemImageUrl: items[0].imageUrl || null,
    renterId,
    renterNickname,
    ownerId: '',
    paymentMethod,
    collateralAmount: totalCollateral,
    rentalCost: totalRentalCost,
    collateralItems: collateralItems || [],
    rentalType,
    rentalDays,
    deliveryLocation,
    termsAccepted: true,
    termsText,
    status: 'pending' as RentalStatus,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, RENTALS_COLLECTION), rental);

  // Mark items as reserved (don't decrease quantity yet - that happens on approval)
  for (const item of items) {
    await updateDoc(doc(db, 'items', item.id), {
      availability: 'reserved',
      updatedAt: serverTimestamp(),
    });
  }

  return docRef.id;
}

export async function approveRental(rentalId: string): Promise<void> {
  const rentalRef = doc(db, RENTALS_COLLECTION, rentalId);
  const rentalDoc = await getDoc(rentalRef);
  
  if (!rentalDoc.exists()) {
    throw new Error('Rental not found');
  }
  
  const rentalData = rentalDoc.data() as Rental;
  
  // Update rental status
  await updateDoc(rentalRef, {
    status: 'active',
    approvedAt: serverTimestamp(),
    startDate: serverTimestamp(),
  });
  
  // Decrease quantity for each item
  const items = rentalData.items || [];
  for (const rentalItem of items) {
    const itemRef = doc(db, 'items', rentalItem.itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (itemDoc.exists()) {
      const itemData = itemDoc.data();
      const currentAvailable = itemData.availableQuantity || itemData.quantity || 1;
      const newAvailable = Math.max(0, currentAvailable - rentalItem.quantity);
      
      await updateDoc(itemRef, {
        availableQuantity: newAvailable,
        availability: newAvailable === 0 ? 'unavailable' : 'available',
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  // Handle legacy single-item rentals
  if (!items.length && rentalData.itemId) {
    const itemRef = doc(db, 'items', rentalData.itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (itemDoc.exists()) {
      const itemData = itemDoc.data();
      const currentAvailable = itemData.availableQuantity || itemData.quantity || 1;
      const newAvailable = Math.max(0, currentAvailable - 1);
      
      await updateDoc(itemRef, {
        availableQuantity: newAvailable,
        availability: newAvailable === 0 ? 'unavailable' : 'available',
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function completeRental(rentalId: string): Promise<void> {
  const rentalRef = doc(db, RENTALS_COLLECTION, rentalId);
  const rentalDoc = await getDoc(rentalRef);
  
  if (!rentalDoc.exists()) {
    throw new Error('Rental not found');
  }
  
  const rentalData = rentalDoc.data() as Rental;
  
  await updateDoc(rentalRef, {
    status: 'completed',
    endDate: serverTimestamp(),
  });

  // Restore quantity for each item
  const items = rentalData.items || [];
  for (const rentalItem of items) {
    const itemRef = doc(db, 'items', rentalItem.itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (itemDoc.exists()) {
      const itemData = itemDoc.data();
      const currentAvailable = itemData.availableQuantity || 0;
      const totalQty = itemData.quantity || 1;
      const newAvailable = Math.min(totalQty, currentAvailable + rentalItem.quantity);
      
      await updateDoc(itemRef, {
        availableQuantity: newAvailable,
        availability: 'available',
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  // Handle legacy single-item rentals
  if (!items.length && rentalData.itemId) {
    await updateDoc(doc(db, 'items', rentalData.itemId), {
      availability: 'available',
      updatedAt: serverTimestamp(),
    });
  }
}

export async function cancelRental(rentalId: string): Promise<void> {
  const rentalRef = doc(db, RENTALS_COLLECTION, rentalId);
  const rentalDoc = await getDoc(rentalRef);
  
  if (!rentalDoc.exists()) {
    throw new Error('Rental not found');
  }
  
  const rentalData = rentalDoc.data() as Rental;
  
  await updateDoc(rentalRef, {
    status: 'cancelled',
    endDate: serverTimestamp(),
  });

  // Restore items to available (they were only reserved, not quantity decreased)
  const items = rentalData.items || [];
  for (const rentalItem of items) {
    const itemRef = doc(db, 'items', rentalItem.itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (itemDoc.exists()) {
      const itemData = itemDoc.data();
      // Only restore to available if it was reserved by this rental
      if (itemData.availability === 'reserved') {
        await updateDoc(itemRef, {
          availability: 'available',
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
  
  // Handle legacy single-item rentals
  if (!items.length && rentalData.itemId) {
    await updateDoc(doc(db, 'items', rentalData.itemId), {
      availability: 'available',
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteRental(rentalId: string): Promise<void> {
  const rentalRef = doc(db, RENTALS_COLLECTION, rentalId);
  const rentalDoc = await getDoc(rentalRef);
  
  if (!rentalDoc.exists()) {
    throw new Error('Rental not found');
  }
  
  const rentalData = rentalDoc.data() as Rental;
  
  // If rental was active, restore item quantities
  if (rentalData.status === 'active') {
    const items = rentalData.items || [];
    for (const rentalItem of items) {
      const itemRef = doc(db, 'items', rentalItem.itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const itemData = itemDoc.data();
        const currentAvailable = itemData.availableQuantity || 0;
        const totalQty = itemData.quantity || 1;
        const newAvailable = Math.min(totalQty, currentAvailable + rentalItem.quantity);
        
        await updateDoc(itemRef, {
          availableQuantity: newAvailable,
          availability: 'available',
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    // Handle legacy single-item rentals
    if (!items.length && rentalData.itemId) {
      await updateDoc(doc(db, 'items', rentalData.itemId), {
        availability: 'available',
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  // If rental was pending/reserved, just restore availability
  if (rentalData.status === 'pending') {
    const items = rentalData.items || [];
    for (const rentalItem of items) {
      const itemRef = doc(db, 'items', rentalItem.itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const itemData = itemDoc.data();
        if (itemData.availability === 'reserved') {
          await updateDoc(itemRef, {
            availability: 'available',
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  }
  
  // Delete the rental document
  await deleteDoc(rentalRef);
}

export async function getUserRentals(userId: string): Promise<Rental[]> {
  console.log('Fetching rentals for user:', userId);
  
  const q = query(
    collection(db, RENTALS_COLLECTION),
    where('renterId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  console.log('Found rentals:', snapshot.docs.length);
  
  const rentals = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('Rental renterId:', data.renterId, 'matches userId:', data.renterId === userId);
    return {
      id: doc.id,
      ...data
    };
  }) as Rental[];
  
  // Sort by createdAt descending client-side
  return rentals.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function getPendingRentals(): Promise<Rental[]> {
  const q = query(
    collection(db, RENTALS_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rental[];
}

export async function getActiveRentals(): Promise<Rental[]> {
  const q = query(
    collection(db, RENTALS_COLLECTION),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rental[];
}

export async function getAllRentals(): Promise<Rental[]> {
  const q = query(
    collection(db, RENTALS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Rental[];
}

// Helper function to calculate remaining time
export function calculateRemainingTime(rental: Rental): { days: number; hours: number; minutes: number; expired: boolean } {
  if (!rental.approvedAt || rental.status !== 'active') {
    return { days: 0, hours: 0, minutes: 0, expired: false };
  }

  const approvedDate = rental.approvedAt.toDate();
  const endDate = new Date(approvedDate);
  endDate.setDate(endDate.getDate() + rental.rentalDays);

  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
}
