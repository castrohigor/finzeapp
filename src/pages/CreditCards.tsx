import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { CreditCard } from '@/types/finance';
import { CreditCardItem } from '@/components/CreditCardItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRESET_COLORS = [
  '#1e40af', '#7c3aed', '#be185d', '#0f766e', '#c2410c',
  '#4338ca', '#0284c7', '#15803d', '#b91c1c', '#6d28d9',
];

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const CreditCards = () => {
  const {
    creditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardBalance,
  } = useFinanceData();

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [closingDay, setClosingDay] = useState('3');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const currentMonth = getCurrentMonth();

  const cardBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    creditCards.forEach((card) => {
      balances[card.id] = getCreditCardBalance(card.id, currentMonth);
    });
    return balances;
  }, [creditCards, currentMonth, getCreditCardBalance]);

  const resetForm = () => {
    setName('');
    setLimit('');
    setDueDay('10');
    setClosingDay('3');
    setColor(PRESET_COLORS[0]);
    setEditingCard(null);
    setShowForm(false);
  };

  const openEditForm = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setLimit(String(card.limit));
    setDueDay(String(card.dueDay));
    setClosingDay(String(card.closingDay));
    setColor(card.color);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitValue = parseFloat(limit.replace(',', '.')) || 0;
    const dueDayValue = parseInt(dueDay) || 10;
    const closingDayValue = parseInt(closingDay) || 3;

    if (editingCard) {
      updateCreditCard(editingCard.id, {
        name,
        limit: limitValue,
        dueDay: dueDayValue,
        closingDay: closingDayValue,
        color,
      });
    } else {
      addCreditCard({
        name,
        limit: limitValue,
        dueDay: dueDayValue,
        closingDay: closingDayValue,
        color,
      });
    }

    resetForm();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-xl font-bold">Cartões de Crédito</h1>
      </div>

      <div className="content-container">
        <div className="space-y-3">
          {creditCards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              usedAmount={cardBalances[card.id] || 0}
              onEdit={openEditForm}
              onDelete={deleteCreditCard}
            />
          ))}

          {creditCards.length === 0 && (
            <div className="stat-card text-center py-12">
              <p className="text-muted-foreground mb-2">
                Nenhum cartão cadastrado
              </p>
              <p className="text-sm text-muted-foreground">
                Toque no + para adicionar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setShowForm(true)} className="floating-button">
        <Plus className="w-6 h-6" />
      </button>

      {/* Credit Card Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="page-header flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
            </h1>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="form-section">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cartão</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limite (R$)</Label>
              <Input
                id="limit"
                type="text"
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closingDay">Dia de Fechamento</Label>
                <Input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="28"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de Vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="28"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  required
                />
              </div>
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
              {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
