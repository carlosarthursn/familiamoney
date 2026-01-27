import { LucideIcon, icons } from 'lucide-react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  created_at: string;
}

export interface TransactionInsert {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'food', label: 'Alimentação', icon: 'Utensils' },
  { id: 'rent', label: 'Aluguel', icon: 'House' },
  { id: 'transport', label: 'Transporte', icon: 'Car' },
  { id: 'leisure', label: 'Lazer', icon: 'Gamepad2' },
  { id: 'bills', label: 'Contas', icon: 'Receipt' },
  { id: 'health', label: 'Saúde', icon: 'Heart' },
  { id: 'education', label: 'Educação', icon: 'GraduationCap' },
  { id: 'shopping', label: 'Compras', icon: 'ShoppingBag' },
  { id: 'other', label: 'Outros', icon: 'Ellipsis' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', label: 'Salário', icon: 'Briefcase' },
  { id: 'freelance', label: 'Freelance', icon: 'Laptop' },
  { id: 'investment', label: 'Investimentos', icon: 'TrendingUp' },
  { id: 'gift', label: 'Presente', icon: 'Gift' },
  { id: 'other', label: 'Outros', icon: 'Ellipsis' },
];

export const getCategoryInfo = (categoryId: string, type: TransactionType): CategoryInfo => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(c => c.id === categoryId) || { id: categoryId, label: categoryId, icon: 'Circle' };
};

export const getCategoryIcon = (iconName: string): LucideIcon => {
  return (icons as Record<string, LucideIcon>)[iconName] || icons.Circle;
};
