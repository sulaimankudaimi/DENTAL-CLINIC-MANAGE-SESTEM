import React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    dir="rtl"
    className={cn(
      'fixed bottom-0 start-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:start-0 sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

export const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-card p-4 shadow-lg transition-all border select-none',
  {
    variants: {
      variant: {
        default: 'bg-surface-card border-surface-border text-text-primary',
        success: 'bg-status-ok-bg border-status-ok-fg/20 text-status-ok-fg',
        warning: 'bg-status-warn-bg border-status-warn-fg/20 text-status-warn-fg',
        danger: 'bg-status-danger-bg border-status-danger-fg/20 text-status-danger-fg',
        error: 'bg-status-danger-bg border-status-danger-fg/20 text-status-danger-fg',
        info: 'bg-status-info-bg border-brand-navy/20 text-brand-navy',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      dir="rtl"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-surface-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute end-2 top-2 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-xs font-bold leading-tight', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-xs opacity-90 leading-normal mt-0.5', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: Omit<ToastItem, 'id'>) => void;
  showToast: (options: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const normalizedVariant = options.variant === 'error' ? 'danger' : options.variant;
    setToasts((prev) => [...prev, { ...options, variant: normalizedVariant, id }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, showToast: toast, dismiss }}>
      <ToastProvider duration={4000}>
        {children}
        <ToastViewport />
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
          >
            <div className="flex items-start gap-3 w-full">
              <span className="shrink-0 mt-0.5" aria-hidden="true">
                {t.variant === 'success' && <CheckCircle className="w-4 h-4" />}
                {t.variant === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {t.variant === 'danger' && <AlertCircle className="w-4 h-4" />}
                {t.variant === 'info' && <Info className="w-4 h-4" />}
              </span>
              <div className="flex flex-col gap-0.5 pe-4 flex-1">
                {t.title && <ToastTitle>{t.title}</ToastTitle>}
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContextProvider');
  }
  return context;
}
