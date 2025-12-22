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