import { useState, useCallback } from 'react';
import { ShippingAddress } from '../types';

interface UseCepResult {
  address: ShippingAddress | null;
  loading: boolean;
  error: string | null;
  fetchAddress: (cep: string) => Promise<void>;
  clearAddress: () => void;
}

export function useCep(): UseCepResult {
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = useCallback(async (cep: string) => {
    setLoading(true);
    setError(null);
    setAddress(null); // Limpa o endereço anterior ao iniciar nova busca

    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setError('CEP deve conter 8 dígitos.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (response.ok && !data.erro) {
        setAddress({
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          localidade: data.localidade,
          uf: data.uf,
        });
      } else {
        setError('CEP não encontrado ou inválido.');
      }
    } catch (err) {
      console.error('Erro ao consultar ViaCEP:', err);
      setError('Erro ao consultar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAddress = useCallback(() => {
    setAddress(null);
    setError(null);
    setLoading(false);
  }, []);

  return { address, loading, error, fetchAddress, clearAddress };
}