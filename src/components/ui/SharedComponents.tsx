/* ============================================================
   LeadScaper Pro — Card, Badge, Progress, Skeleton, Switch,
   Tooltip, Toast Container Components
   ============================================================ */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/formatters';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Toast } from '@/hooks/useToast';

/* -------------------------------------------------------
   Card
   ------------------------------------------------------- */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hoverable, onClick }: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-5',
        hoverable && 'cursor-pointer glass-hover',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------
   Badge
   ------------------------------------------------------- */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
}

const badgeVariants: Record<string, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  success: 'bg-green-500/15 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------
   Progress Bar
   ------------------------------------------------------- */
interface ProgressProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Progress({ value, showLabel = false, size = 'md', className }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex-1 rounded-full overflow-hidden bg-[var(--bg-tertiary)]',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-[var(--text-secondary)] min-w-[40px] text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Skeleton Loading
   ------------------------------------------------------- */
interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width, height = '16px', rounded = false, className }: SkeletonProps) {
  return (
    <div
      className={cn('shimmer', rounded ? 'rounded-full' : 'rounded-lg', className)}
      style={{ width: width || '100%', height }}
    />
  );
}

/* -------------------------------------------------------
   Switch / Toggle
   ------------------------------------------------------- */
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5.5 rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          checked ? 'bg-brand-500' : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ height: '22px' }}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
    </label>
  );
}

/* -------------------------------------------------------
   Tooltip
   ------------------------------------------------------- */
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
          'px-2.5 py-1 text-xs rounded-lg whitespace-nowrap',
          'bg-surface-800 text-white shadow-lg border border-surface-700',
          'opacity-0 group-hover:opacity-100 pointer-events-none',
          'transition-opacity duration-150 z-50'
        )}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface-800" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Stat Card
   ------------------------------------------------------- */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

export function StatCard({ label, value, icon, trend, trendUp, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
          {icon}
        </span>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trendUp ? 'text-green-400' : 'text-red-400'
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
        {value}
      </div>
      <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------
   Toast Container
   ------------------------------------------------------- */
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const toastStyles: Record<string, string> = {
  success: 'border-green-500/30 text-green-400',
  error: 'border-red-500/30 text-red-400',
  warning: 'border-yellow-500/30 text-yellow-400',
  info: 'border-brand-500/30 text-brand-400',
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={cn(
              'glass rounded-xl px-4 py-3 flex items-start gap-3 border',
              toastStyles[toast.type]
            )}
          >
            <span className="mt-0.5">{toastIcons[toast.type]}</span>
            <span className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------
   Empty State
   ------------------------------------------------------- */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <span className="p-4 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] mb-4">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-4">{description}</p>
      {action}
    </motion.div>
  );
}
