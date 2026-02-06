import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createItem, updateItem } from '@/services/itemService';
import { getAllCategories, Category } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { GameItem } from '@/types/gameItems';
import { Plus, Save, Link, X, Loader2 } from 'lucide-react';

interface ItemFormProps {
  item?: GameItem;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ItemForm({ item, onSuccess, onCancel }: ItemFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [dailyRate, setDailyRate] = useState(item?.dailyRate?.toString() || '');
  const [weeklyRate, setWeeklyRate] = useState(item?.weeklyRate?.toString() || '');
  const [marketRate, setMarketRate] = useState(item?.marketRate?.toString() || '');
  const [collateral, setCollateral] = useState(item?.requiredCollateral?.toString() || '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '1');
  const [availability, setAvailability] = useState<'available' | 'unavailable' | 'reserved'>(
    item?.availability || 'available'
  );
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !marketRate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const qty = parseInt(quantity) || 1;
      // When editing, calculate availableQuantity based on quantity change
      let availableQty = qty;
      if (item) {
        const oldQty = item.quantity || 1;
        const oldAvailable = item.availableQuantity ?? oldQty;
        const rentedCount = oldQty - oldAvailable;
        availableQty = Math.max(0, qty - rentedCount);
      }
      
      // Calculate other values from marketRate (value)
      const value = parseInt(marketRate) || 0;
      const calculatedDaily = Math.floor(value * 0.02);
      const calculatedWeekly = Math.floor(value * 0.015 * 7); // weeklyRate usually total for week, or per day? 
      // User said "semanal vai ser 1,5% ao dio". Weekly rate is usually stored as total cost per week?
      // Looking at RentalModal: "rate = rentalDays <= 6 ? item.dailyRate * rentalDays : item.weeklyRate"
      // Wait, if weeklyRate is ONE value for the whole week, it should be 1.5% * 7 * value?
      // Or is weeklyRate a per-day rate?
      // In RentalModal: item.weeklyRate usually implies a bulk rate.
      // If weekly is 1.5% per day, then for 7 days it is 10.5% total.
      // If RentalModal uses `item.weeklyRate` as the cost for >6 days (which is usually 7), it treats `weeklyRate` as the Cost For The Week.
      // Let's assume weeklyRate field stores the TOTAL cost for a week rental.
      const calculatedWeeklyRate = Math.floor(value * 0.015); // Storing as daily equiv?
      // Check RentalModal logic: `const rate = rentalDays <= 6 ? item.dailyRate * rentalDays : item.weeklyRate;`
      // If rentalDays is 7, cost is `item.weeklyRate`.
      // So `item.weeklyRate` must be the TOTAL cost for 7 days.
      // User: "semanal vai ser 1,5% ao dio". 1.5% per day * 7 days = 10.5%.
      // So weeklyRate = value * 0.105.
      
      const calculatedCollateral = Math.floor(value * 0.8);

      const itemData: Record<string, any> = {
        name,
        category,
        availability,
        dailyRate: calculatedDaily,
        weeklyRate: Math.floor(value * 0.015 * 7), // Total for week
        marketRate: value,
        requiredCollateral: calculatedCollateral,
        quantity: qty,
        availableQuantity: availableQty,
      };
      
      // Only include imageUrl if it has a value
      if (imageUrl) {
        itemData.imageUrl = imageUrl;
      }

      if (item) {
        await updateItem(item.id, itemData as Partial<GameItem>);
        toast({
          title: "Item atualizado!",
          description: `${name} foi atualizado com sucesso.`,
        });
      } else {
        await createItem(itemData as Omit<GameItem, 'id'>, user.uid);
        toast({
          title: "Item cadastrado!",
          description: `${name} foi adicionado ao marketplace.`,
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="flex items-center gap-2">
          <Link className="w-4 h-4 text-primary" />
          URL da Imagem
        </Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.png"
          className="bg-muted border-border"
        />
        {imageUrl && (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImageUrl('')}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
              Remover
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome do Item *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Vindicator M60"
          className="bg-muted border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-muted border-border">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Nenhuma categoria cadastrada
              </div>
            ) : (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="availability">Disponibilidade</Label>
        <Select value={availability} onValueChange={(v) => setAvailability(v as any)}>
          <SelectTrigger className="bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="unavailable">Indisponível</SelectItem>
            <SelectItem value="reserved">Reservado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketRate">Valor do Item ($)</Label>
        <Input
          id="marketRate"
          type="number"
          value={marketRate}
          onChange={(e) => setMarketRate(e.target.value)}
          placeholder="117777777"
          className="bg-muted border-border font-mono"
        />
        <p className="text-xs text-muted-foreground">
          O valor do aluguel e colateral serão calculados automaticamente (Diária: 2%, Semanal: 1.5%/dia, Colateral: 80%).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          className="bg-muted border-border font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Quantidade total deste item em estoque
        </p>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="cyber" className="flex-1 gap-2" disabled={loading}>
          {loading ? (
            'Salvando...'
          ) : item ? (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Cadastrar Item
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
