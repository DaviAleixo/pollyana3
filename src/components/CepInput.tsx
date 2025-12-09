import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, MapPin, XCircle, CheckCircle } from 'lucide-react';
import { useCep } from '../hooks/useCep';
import { ShippingAddress } from '../types';

interface CepInputProps {
  onAddressChange: (address: ShippingAddress | null) => void;
  initialCep?: string;
  className?: string;
}

const CepInput: React.FC<CepInputProps> = ({ onAddressChange, initialCep = '', className }) => {
  const [cep, setCep] = useState(initialCep);
  const { address, loading, error, fetchAddress, clearAddress } = useCep();

  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) {
      return digits;
    }
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCep(rawValue);
    setCep(formattedValue);

    if (address || error) {
      clearAddress();
    }
  };

  const handleBlur = () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8 && !address && !loading && !error) {
      fetchAddress(cleanCep);
    }
  };

  const handleSearchClick = () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddress(cleanCep);
    } else {
      clearAddress();
      onAddressChange(null);
    }
  };

  const handleClearClick = () => {
    setCep('');
    clearAddress();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">
        CEP para cálculo de frete *
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={cep}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={9}
            className="w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:border-black rounded-md"
            placeholder="00000-000"
            aria-label="Digite seu CEP"
          />
          {cep && !loading && !error && !address && (
            <button
              type="button"
              onClick={handleClearClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Limpar CEP"
            >
              <XCircle className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={loading || cep.replace(/\D/g, '').length !== 8}
          className="bg-black text-white p-3 hover:bg-gray-800 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Buscar CEP"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          ) : (
            <Search className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md animate-fade-in">
          <XCircle className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {address && (
        <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-md animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="text-sm">
            <p className="font-semibold">Endereço encontrado:</p>
            <p>{address.logradouro}, {address.bairro}</p>
            <p>{address.localidade} - {address.uf}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CepInput;