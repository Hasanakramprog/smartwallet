import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Film,
  HeartPulse,
  ShoppingBag,
  Laptop,
  Plane,
  Sparkles,
  BookOpen,
  Coffee,
  Gift,
  Tag,
  DollarSign,
  Wallet,
  CreditCard,
  PiggyBank,
  Briefcase,
  Shield,
  Dumbbell,
  GraduationCap,
  Music,
  Tv,
  Gamepad2,
  Bus,
  Train,
  Fuel,
  Wrench,
  Stethoscope,
  Smile,
  LucideProps,
  HelpCircle
} from 'lucide-react';

export const AVAILABLE_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Film,
  HeartPulse,
  ShoppingBag,
  Laptop,
  Plane,
  Sparkles,
  BookOpen,
  Coffee,
  Gift,
  Tag,
  DollarSign,
  Wallet,
  CreditCard,
  PiggyBank,
  Briefcase,
  Shield,
  Dumbbell,
  GraduationCap,
  Music,
  Tv,
  Gamepad2,
  Bus,
  Train,
  Fuel,
  Wrench,
  Stethoscope,
  Smile,
};

export const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#84cc16', // Lime
  '#64748b', // Slate
];

interface CategoryIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  if (!name) {
    return <Tag {...props} />;
  }

  // Capitalize or normalize key lookup
  const normalizedKey = Object.keys(AVAILABLE_ICONS).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );

  const IconComponent = normalizedKey ? AVAILABLE_ICONS[normalizedKey] : HelpCircle;
  return <IconComponent {...props} />;
}
