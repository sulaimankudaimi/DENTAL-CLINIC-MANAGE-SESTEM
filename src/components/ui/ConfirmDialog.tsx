import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  tone?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'danger',
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader className="border-0 pb-0">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                tone === 'danger'
                  ? 'bg-status-danger-bg text-status-danger-fg'
                  : 'bg-status-info-bg text-brand-blue'
              }`}
              aria-hidden="true"
            >
              {tone === 'danger' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <ModalTitle>{title}</ModalTitle>
              <ModalDescription className="mt-1">{description}</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalFooter className="border-0 pt-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';
