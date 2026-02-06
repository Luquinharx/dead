import { useState, useEffect } from 'react';
import { Category, getAllCategories, deleteCategory, createCategory } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Tag, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da categoria',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setAdding(true);
    try {
      await createCategory(newCategory, user.uid);
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a categoria',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
      });
      setDeleteTarget(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a categoria',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="space-y-4">
        <div>
          <h3 className="font-display text-lg text-foreground">Nova Categoria</h3>
          <p className="text-sm text-muted-foreground">
            Adicione uma nova categoria de itens
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nome da categoria..."
            className="flex-1 bg-background border-border"
          />
          <Button 
            type="submit" 
            disabled={adding || !newCategory.trim()}
            className="gap-2"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Adicionar
          </Button>
        </div>
      </form>

      {/* Categories List */}
      <div className="space-y-2">
        <h4 className="font-display text-sm text-muted-foreground uppercase tracking-wider">
          Categorias ({categories.length})
        </h4>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{category.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/20 hover:text-destructive"
                  onClick={() => setDeleteTarget(category)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deleteTarget?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
