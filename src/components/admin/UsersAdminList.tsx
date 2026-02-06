import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ShieldOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface UserWithRole {
  uid: string;
  email: string;
  gameNickname: string;
  role: 'admin' | 'user';
}

export function UsersAdminList() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLanguage();

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const rolesSnap = await getDocs(collection(db, 'userRoles'));

      const rolesMap: Record<string, 'admin' | 'user'> = {};
      rolesSnap.docs.forEach(d => {
        rolesMap[d.id] = d.data().role as 'admin' | 'user';
      });

      const list: UserWithRole[] = usersSnap.docs.map(d => ({
        uid: d.id,
        email: d.data().email,
        gameNickname: d.data().gameNickname,
        role: rolesMap[d.id] || 'user',
      }));

      setUsers(list);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível carregar usuários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (uid: string, currentRole: 'admin' | 'user') => {
    if (uid === user?.uid && currentRole === 'admin') {
      toast({ title: 'Ação não permitida', description: 'Você não pode remover sua própria permissão de admin', variant: 'destructive' });
      return;
    }

    try {
      setUpdating(uid);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'userRoles', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast({ title: 'Sucesso', description: `Permissão atualizada para ${newRole}` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a permissão', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const deleteAccount = async (uid: string) => {
    if (uid === user?.uid) {
      toast({ title: 'Ação não permitida', description: 'Você não pode excluir sua própria conta', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm('Excluir usuário? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      setUpdating(uid);
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'userRoles', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast({ title: 'Conta excluída', description: 'Usuário removido com sucesso.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a conta', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) return null;

  const filtered = users.filter(u =>
    u.gameNickname.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-1">
          <Input
            placeholder={t(lang, 'filterPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-48 text-sm text-muted-foreground text-right">
          {filtered.length} / {users.length}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.uid} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">{u.gameNickname}</h4>
                    <span className={`text-xs font-medium ${u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{u.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant={u.role === 'admin' ? 'destructive' : 'cyber'}
                onClick={() => toggleRole(u.uid, u.role)}
                disabled={updating === u.uid}
                className="flex items-center gap-2"
              >
                {u.role === 'admin' ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    <span className="hidden sm:inline">{t(lang, 'removeAdmin')}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">{t(lang, 'promote')}</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteAccount(u.uid)}
                disabled={updating === u.uid}
              >
                {t(lang, 'delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UsersAdminList;
