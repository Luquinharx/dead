import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  ShieldOff, 
  Search,
  Loader2,
  Crown
} from 'lucide-react';

interface UserWithRole {
  uid: string;
  email: string;
  gameNickname: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const rolesSnapshot = await getDocs(collection(db, 'userRoles'));
      
      // Criar mapa de roles
      const rolesMap: Record<string, 'admin' | 'user'> = {};
      rolesSnapshot.docs.forEach(doc => {
        rolesMap[doc.id] = doc.data().role as 'admin' | 'user';
      });
      
      // Combinar dados
      const usersData: UserWithRole[] = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email,
        gameNickname: doc.data().gameNickname,
        role: rolesMap[doc.id] || 'user',
        createdAt: doc.data().createdAt,
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    // Não permitir remover próprio admin
    if (userId === user?.uid && currentRole === 'admin') {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover sua própria permissão de admin",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(userId);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      await updateDoc(doc(db, 'userRoles', userId), {
        role: newRole
      });
      
      setUsers(users.map(u => 
        u.uid === userId ? { ...u, role: newRole } : u
      ));
      
      toast({
        title: "Sucesso",
        description: `Usuário ${newRole === 'admin' ? 'promovido a admin' : 'rebaixado para usuário'}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteAccount = async (userId: string) => {
    if (userId === user?.uid) {
      toast({ title: 'Ação não permitida', description: 'Você não pode excluir sua própria conta', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      setUpdating(userId);
      // Remove user document and role document
      await deleteDoc(doc(db, 'users', userId));
      await deleteDoc(doc(db, 'userRoles', userId));

      setUsers(users.filter(u => u.uid !== userId));
      toast({ title: 'Conta excluída', description: 'A conta foi removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a conta', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.gameNickname.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl md:text-3xl flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie as permissões dos usuários
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nickname..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Nickname</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.uid} className="border-border">
                        <TableCell className="font-medium">
                          {u.gameNickname}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={u.role === 'admin' ? 'default' : 'secondary'}
                            className={u.role === 'admin' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                          >
                            {u.role === 'admin' ? (
                              <><Shield className="w-3 h-3 mr-1" /> Admin</>
                            ) : (
                              'Usuário'
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={u.role === 'admin' ? 'destructive' : 'cyber'}
                            size="sm"
                            onClick={() => toggleRole(u.uid, u.role)}
                            disabled={updating === u.uid || (u.uid === user?.uid && u.role === 'admin')}
                          >
                            {updating === u.uid ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.role === 'admin' ? (
                              <><ShieldOff className="w-4 h-4 mr-1" /> Remover Admin</>
                            ) : (
                              <><Shield className="w-4 h-4 mr-1" /> Tornar Admin</>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => deleteAccount(u.uid)}
                            disabled={updating === u.uid || (u.uid === user?.uid)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
