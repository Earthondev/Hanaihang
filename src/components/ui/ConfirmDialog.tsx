import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    description,
    confirmLabel = 'ยืนยัน',
    cancelLabel = 'ยกเลิก',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    if (!isOpen || !isBrowser) return null;

    const content = (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-start">
                        <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4
              ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
            `}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 font-kanit">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed font-prompt">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 font-prompt">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`
                   px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center
                   ${variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                            }
                `}
                    >
                        {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default ConfirmDialog;
