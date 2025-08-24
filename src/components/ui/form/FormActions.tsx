import React from 'react';
import { useFormContext } from 'react-hook-form';
import { BaseButton } from '../BaseButton';

interface FormActionsProps {
  submitLabel?: string;
  resetLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

export default function FormActions({
  submitLabel = "บันทึก",
  resetLabel = "ล้างค่า",
  onCancel,
  cancelLabel = "ยกเลิก",
  loading = false,
  className = ""
}: FormActionsProps) {
  const { formState: { isSubmitting, isDirty }, reset } = useFormContext();
  const isFormLoading = loading || isSubmitting;

  const handleReset = () => {
    reset();
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_reset', {
        event_category: 'form_actions',
        event_label: 'reset'
      });
    }
  };

  return (
    <div className={`flex items-center gap-3 pt-4 ${className}`}>
      <BaseButton
        type="submit"
        loading={isFormLoading}
        disabled={isFormLoading}
        className="min-w-[120px]"
      >
        {isFormLoading ? "กำลังบันทึก..." : submitLabel}
      </BaseButton>
      
      {isDirty && (
        <BaseButton
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isFormLoading}
        >
          {resetLabel}
        </BaseButton>
      )}
      
      {onCancel && (
        <BaseButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isFormLoading}
        >
          {cancelLabel}
        </BaseButton>
      )}
    </div>
  );
}
