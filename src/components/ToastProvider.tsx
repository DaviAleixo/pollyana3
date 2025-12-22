"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '8px',
          background: '#333',
          color: '#fff',
        },
        success: {
          iconTheme: {
            primary: '#10B981', // Green-500
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444', // Red-500
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;