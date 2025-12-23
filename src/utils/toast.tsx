import React from 'react';
import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
};

export const showSuccess = (message: string) => {
  toast.success(message, defaultOptions);
};

export const showError = (message: string) => {
  toast.error(message, defaultOptions);
};

export const showInfo = (message: string) => {
  toast(message, {
    ...defaultOptions,
    icon: '💡',
    style: {
      background: '#3B82F6', // Blue-500
      color: '#fff',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, defaultOptions);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Exibe um toast de confirmação com botões de Ação e Cancelar.
 * @param message A mensagem de confirmação.
 * @param onConfirm Callback a ser executado se o usuário confirmar.
 * @param actionLabel Rótulo do botão de ação (ex: 'Remover').
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  actionLabel: string = 'Confirmar'
) => {
  toast(
    (t) => (
      <div className="flex flex-col">
        <p className="text-sm font-medium text-white mb-3">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="bg-red-600 text-white px-3 py-1 text-xs font-semibold hover:bg-red-700 transition-colors rounded"
          >
            {actionLabel}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-700 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-600 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity, // Mantém aberto até o usuário interagir
      style: {
        background: '#333',
        color: '#fff',
        maxWidth: '400px',
      },
      icon: '⚠️',
    }
  );
};