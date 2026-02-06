import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc, 
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Category {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
}

const CATEGORIES_COLLECTION = 'categories';

export async function createCategory(name: string, userId: string): Promise<string> {
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    name: name.trim(),
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
}

export async function getAllCategories(): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Category[];
}
