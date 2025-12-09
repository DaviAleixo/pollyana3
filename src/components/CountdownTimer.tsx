import React, { useState, useEffect } from 'react';
import { formatCountdown } from '../utils/productUtils';

interface CountdownTimerProps {
  expirationDate: string;
  className?: string;
  onExpire?: () => void; // Callback para quando o timer expirar
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expirationDate, className, onExpire }) => {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = formatCountdown(expirationDate);
      setCountdown(newCountdown);

      if (newCountdown === null && onExpire) {
        onExpire(); // Chama o callback se o timer expirou
      }
    };

    updateCountdown(); // Atualiza imediatamente na montagem

    const intervalId = setInterval(updateCountdown, 1000); // Atualiza a cada segundo

    return () => clearInterval(intervalId); // Limpa o intervalo na desmontagem
  }, [expirationDate, onExpire]);

  if (!countdown) {
    return null; // Não exibe nada se o desconto expirou ou não há data
  }

  return (
    <span className={`inline-block bg-red-50 text-red-700 text-xs font-medium px-2 py-1 rounded-full ${className}`}> {/* Estilo de badge para o timer */}
      Termina em: {countdown}
    </span>
  );
};

export default CountdownTimer;