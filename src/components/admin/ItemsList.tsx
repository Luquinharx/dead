import { useState, useEffect } from 'react';
import { GameItem } from '@/types/gameItems';
import { getAllItems, deleteItem } from '@/services/itemService';
import { formatCurrency } from '@/utils/formatCurrency';
import { ItemIcon } from '@/components/ItemIcon';
import { AvailabilityBadge } from '@/components/AvailabilityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ItemForm } from './ItemForm';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  RefreshCw,
  Image
} from 'lucide-react';

export function ItemsList() {
  const [items, setItems] = useState<GameItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<GameItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getAllItems();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let result = items;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by availability
    if (filterAvailability !== 'all') {
      result = result.filter(item => item.availability === filterAvailability);
    }

    setFilteredItems(result);
  }, [items, searchTerm, filterAvailability]);

  const handleEdit = (item: GameItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = async (item: GameItem) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.name}"?`)) return;

    try {
      await deleteItem(item.id);
      toast({
        title: "Item excluído",
        description: `${item.name} foi removido do marketplace.`,
      });
      fetchItems();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="w-[180px] bg-muted border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="unavailable">Indisponíveis</SelectItem>
              <SelectItem value="reserved">Reservados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cyber-border rounded-lg p-4 text-center">
          <p className="text-2xl font-display font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total de Itens</p>
        </div>
        <div className="cyber-border rounded-lg p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary neon-text">
            {items.filter(i => i.availability === 'available').length}
          </p>
          <p className="text-xs text-muted-foreground">Disponíveis</p>
        </div>
        <div className="cyber-border rounded-lg p-4 text-center">
          <p className="text-2xl font-display font-bold text-accent">
            {items.filter(i => i.availability === 'reserved').length}
          </p>
          <p className="text-xs text-muted-foreground">Alugados</p>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-cyber">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                  Item
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs">
                  Status
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-right">
                  Colateral
                </TableHead>
                <TableHead className="text-primary font-display uppercase tracking-wider text-xs text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Carregando itens...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ItemIcon category={item.category} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AvailabilityBadge availability={item.availability} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary font-semibold">
                      {formatCurrency(item.requiredCollateral)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="hover:bg-primary/20 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(item)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              Editar Item
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm 
              item={editingItem} 
              onSuccess={handleEditSuccess}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
