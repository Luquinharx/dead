import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ChatMessage {
  id: string;
  rentalId: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  message: string;
  createdAt: Timestamp;
}

const MESSAGES_COLLECTION = 'rental_messages';

export function subscribeToMessages(
  rentalId: string, 
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    orderBy('createdAt', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
    
    // Filter by rentalId client-side (Firebase doesn't support compound queries easily)
    const filteredMessages = messages.filter(m => m.rentalId === rentalId);
    callback(filteredMessages);
  });
  
  return unsubscribe;
}

export async function sendMessage(
  rentalId: string,
  senderId: string,
  senderName: string,
  isAdmin: boolean,
  message: string
): Promise<string> {
  const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
    rentalId,
    senderId,
    senderName,
    isAdmin,
    message,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}
