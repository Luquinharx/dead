import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types/user';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, gameNickname: string, gameId: string, dfProfilerUrl?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkNicknameAvailable: (nickname: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data() as UserProfile;
          setUserProfile(profile);
          
          // Check if user is admin
          const roleDoc = await getDoc(doc(db, 'userRoles', user.uid));
          setIsAdmin(roleDoc.exists() && roleDoc.data()?.role === 'admin');
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
    const normalized = nickname.trim().toLowerCase();
    if (!normalized) return false;
    const nicknameDoc = await getDoc(doc(db, 'nicknames', normalized));
    return !nicknameDoc.exists();
  };

  const signUp = async (email: string, password: string, gameNickname: string, gameId: string, dfProfilerUrl?: string) => {
    const normalizedNickname = gameNickname.trim().toLowerCase();
    if (normalizedNickname.length < 3) {
      throw new Error('Nickname deve ter pelo menos 3 caracteres');
    }

    if (!gameId.trim()) {
      throw new Error('ID do jogo é obrigatório');
    }

    // 1) Create auth user first (this signs the user in)
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // 2) Atomically reserve nickname + create profile + create role
    // This avoids requiring public reads on the users collection and prevents duplicate nicknames.
    try {
      await runTransaction(db, async (tx) => {
        const nicknameRef = doc(db, 'nicknames', normalizedNickname);
        const userRef = doc(db, 'users', user.uid);
        const roleRef = doc(db, 'userRoles', user.uid);

        const nicknameSnap = await tx.get(nicknameRef);
        if (nicknameSnap.exists()) {
          throw new Error('Este nickname já está em uso. Escolha outro.');
        }

        tx.set(nicknameRef, {
          uid: user.uid,
          nickname: normalizedNickname,
          createdAt: serverTimestamp(),
        });

        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          gameNickname: normalizedNickname,
          gameId: gameId.trim(),
          dfProfilerUrl: dfProfilerUrl?.trim() || undefined,
          isAdmin: false,
          // Firestore stores timestamp; type is Date in TS model, but this is fine for persistence.
          createdAt: serverTimestamp() as any,
        };

        tx.set(userRef, userProfile);
        tx.set(roleRef, {
          uid: user.uid,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      });
    } catch (e: any) {
      // If transaction fails, surface a clean error.
      throw new Error(e?.message || 'Não foi possível criar a conta');
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAdmin,
      signUp,
      signIn,
      logout,
      checkNicknameAvailable
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
