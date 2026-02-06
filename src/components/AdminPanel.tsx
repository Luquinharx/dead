import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ItemForm } from './admin/ItemForm';
import { ItemsList } from './admin/ItemsList';
import { RentalsList } from './admin/RentalsList';
import { CategoriesList } from './admin/CategoriesList';
import { Settings, Plus, List, History, Tag, Users as UsersIcon, Shield } from 'lucide-react';
import UsersAdminList from './admin/UsersAdminList';
import GuaranteeSettings from './admin/GuaranteeSettings';

export function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleItemAdded = () => {
    setActiveTab('items');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="cyber-outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Admin
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="bg-card border-l border-border w-full sm:max-w-4xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-primary">
            Painel Admin
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger value="items" className="gap-2 data-[state=active]:bg-primary/20">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Itens</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2 data-[state=active]:bg-primary/20">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-primary/20">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="gap-2 data-[state=active]:bg-primary/20">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Aluguéis</span>
            </TabsTrigger>
            <TabsTrigger value="guarantee" className="gap-2 data-[state=active]:bg-primary/20">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Garantia</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="gap-2 data-[state=active]:bg-primary/20"
              onClick={() => {
                setOpen(false);
                navigate('/admin/orders');
              }}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>

            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary/20">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-6">
            <ItemsList />
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-foreground">Cadastrar Novo Item</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione um novo item ao marketplace
                </p>
              </div>
              <ItemForm onSuccess={handleItemAdded} />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoriesList />
          </TabsContent>

          <TabsContent value="rentals" className="mt-6">
            <RentalsList />
          </TabsContent>

          <TabsContent value="guarantee" className="mt-6">
            <GuaranteeSettings />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersAdminList />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
