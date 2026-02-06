import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameItem } from '@/types/gameItems';

const ITEMS_COLLECTION = 'items';

export interface FirebaseGameItem extends Omit<GameItem, 'id'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export async function createItem(
  item: Omit<GameItem, 'id'>, 
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
    ...item,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateItem(
  itemId: string, 
  updates: Partial<GameItem>
): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
}

export async function getAllItems(): Promise<GameItem[]> {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GameItem[];
}

export async function getItemsByAvailability(
  availability: 'available' | 'unavailable' | 'reserved'
): Promise<GameItem[]> {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('availability', '==', availability),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GameItem[];
}
