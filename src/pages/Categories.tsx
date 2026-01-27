import { useState } from 'react';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Category } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6',
];

export const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceData();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [defaultLimit, setDefaultLimit] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const resetForm = () => {
    setName('');
    setDefaultLimit('');
    setColor(PRESET_COLORS[0]);
    setEditingCategory(null);
    setShowForm(false);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDefaultLimit(String(category.defaultLimit));
    setColor(category.color);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(defaultLimit.replace(',', '.')) || 0;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name, defaultLimit: limit, color });
    } else {
      addCategory({ name, defaultLimit: limit, color });
    }

    resetForm();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-xl font-bold">Categorias</h1>
      </div>

      <div className="content-container">
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-card rounded-xl border border-border animate-slide-up"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Limite: {formatCurrency(category.defaultLimit)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditForm(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCategory(category.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="stat-card text-center py-12">
              <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setShowForm(true)} className="floating-button">
        <Plus className="w-6 h-6" />
      </button>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="page-header flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h1>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="form-section">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alimentação"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limite Mensal (R$)</Label>
              <Input
                id="limit"
                type="text"
                inputMode="decimal"
                value={defaultLimit}
                onChange={(e) => setDefaultLimit(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 mt-4">
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
