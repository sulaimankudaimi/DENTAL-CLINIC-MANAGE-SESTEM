import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  children?: React.ReactNode;
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
  className?: string;
  showCloseButton?: boolean;
}

export const ModalPortal = DialogPrimitive.Portal;
export const ModalClose = DialogPrimitive.Close;
export const ModalTrigger = DialogPrimitive.Trigger;

export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      dir="rtl"
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
        'border border-surface-border bg-surface-card p-6 shadow-2xl rounded-card duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute end-4 top-4 rounded-md p-1.5 text-text-secondary opacity-70 transition-opacity hover:opacity-100 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
          <X className="h-4 w-4" />
          <span className="sr-only">إغلاق</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

export const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-1.5 text-right border-b border-surface-border/50 pb-4', className)}
    {...props}
  />
);
ModalHeader.displayName = 'ModalHeader';

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-bold leading-none text-text-primary', className)}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-text-secondary leading-relaxed', className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-end gap-2 pt-4 border-t border-surface-border/50',
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = 'ModalFooter';

const sizeMap: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] h-[95vh]',
};

export const Modal: React.FC<ModalProps> = ({
  children,
  open,
  isOpen,
  onClose,
  onOpenChange,
  title,
  description,
  size = 'md',
  className,
  showCloseButton = true,
}) => {
  const isControlledOpen = open ?? isOpen ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onClose) onClose();
    if (onOpenChange) onOpenChange(newOpen);
  };

  if (title) {
    return (
      <DialogPrimitive.Root open={isControlledOpen} onOpenChange={handleOpenChange}>
        <ModalPortal>
          <ModalOverlay />
          <DialogPrimitive.Content
            dir="rtl"
            className={cn(
              'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4',
              'border border-surface-border bg-surface-card p-6 shadow-2xl rounded-card duration-200 max-h-[90vh] overflow-y-auto',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
              sizeMap[size] || sizeMap.md,
              className
            )}
          >
            <div className="flex flex-col gap-1.5 text-right border-b border-surface-border/50 pb-3">
              <DialogPrimitive.Title className="text-lg font-bold leading-none text-text-primary">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-text-secondary leading-relaxed">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>

            <div className="py-2">{children}</div>

            {showCloseButton && (
              <DialogPrimitive.Close className="absolute end-4 top-4 rounded-md p-1.5 text-text-secondary opacity-70 transition-opacity hover:opacity-100 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                <X className="h-4 w-4" />
                <span className="sr-only">إغلاق</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Content>
        </ModalPortal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={isControlledOpen} onOpenChange={handleOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
};

export const Dialog = Modal;
export type DialogProps = ModalProps;
