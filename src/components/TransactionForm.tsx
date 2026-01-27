import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, CreditCard, Transaction } from '@/types/finance';
import { generateInstallments, calculateEffectiveMonth } from '@/lib/storage';

interface TransactionFormProps {
  categories: Category[];
  creditCards: CreditCard[];
  onSubmit: (transactions: Transaction[]) => void;
  onClose: () => void;
}

export const TransactionForm = ({
  categories,
  creditCards,
  onSubmit,
  onClose,
}: TransactionFormProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('none');
  const [creditCardId, setCreditCardId] = useState<string>('none');
  const [installments, setInstallments] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!description || isNaN(numericAmount) || numericAmount <= 0) return;

    const numInstallments = parseInt(installments) || 1;
    const selectedCard = creditCardId !== 'none' ? creditCards.find((c) => c.id === creditCardId) : undefined;

    const baseTransaction = {
      description,
      amount: numericAmount,
      type,
      date,
      categoryId: categoryId !== 'none' ? categoryId : undefined,
      creditCardId: creditCardId !== 'none' ? creditCardId : undefined,
    };

    let transactions: Transaction[];

    if (numInstallments > 1) {
      transactions = generateInstallments(baseTransaction, numInstallments, selectedCard);
    } else {
      let effectiveMonth: string;
      if (selectedCard) {
        effectiveMonth = calculateEffectiveMonth(date, selectedCard);
      } else {
        const dateObj = new Date(date);
        effectiveMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      }

      transactions = [{
        ...baseTransaction,
        id: crypto.randomUUID(),
        effectiveMonth,
      }];
    }

    onSubmit(transactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="page-header flex items-center justify-between">
        <h1 className="text-xl font-bold">Novo Lançamento</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="form-section">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'default' : 'outline'}
            onClick={() => setType('expense')}
            className="h-12"
          >
            Despesa
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'default' : 'outline'}
            onClick={() => setType('income')}
            className="h-12"
          >
            Receita
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Supermercado"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria (opcional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === 'expense' && (
          <>
            <div className="space-y-2">
              <Label>Cartão de Crédito (opcional)</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cartão</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}x {num > 1 ? 'parcelas' : 'à vista'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button type="submit" className="w-full h-12 mt-4">
          Adicionar Lançamento
        </Button>
      </form>
    </div>
  );
};
