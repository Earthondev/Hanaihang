import React from 'react';
import { Trash2 } from 'lucide-react';

import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { BaseButton } from '../ui/BaseButton';

interface DeleteButtonProps {
  id: string;
  name: string;
  type: 'mall' | 'store';
  onDelete: (id: string) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
}

export function DeleteButton({ 
  id, 
  name, 
  type, 
  onDelete, 
  onSuccess,
  className = '' 
}: DeleteButtonProps) {
  const { isLoading, run } = useSafeSubmit({
    formName: `${type}_delete`,
    successMessage: `ลบ${type === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า'}สำเร็จ`,
    errorMessage: `ไม่สามารถลบ${type === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า'}ได้`
  });

  const handleDelete = async () => {
    const typeText = type === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า';
    const confirmed = window.confirm(
      `ยืนยันการลบ${typeText} "${name}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`
    );

    if (!confirmed) return;

    await run(async () => {
      await onDelete(id);
      onSuccess?.();
    });
  };

  return (
    <BaseButton
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
      aria-label={`ลบ${type === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า'} ${name}`}
    >
      <Trash2 className="h-4 w-4" />
      {isLoading ? "กำลังลบ..." : "ลบ"}
    </BaseButton>
  );
}
