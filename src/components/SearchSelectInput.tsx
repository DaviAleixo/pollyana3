import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, XCircle } from 'lucide-react';

interface SelectItem {
  id: number;
  name: string;
  description?: string;
}

interface SearchSelectInputProps {
  label: string;
  items: SelectItem[];
  initialSelectedId?: number | null;
  onSelect: (id: number | null) => void;
  placeholder?: string;
  className?: string;
}

const SearchSelectInput: React.FC<SearchSelectInputProps> = ({
  label,
  items,
  initialSelectedId,
  onSelect,
  placeholder = 'Buscar e selecionar...',
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Encontra o item selecionado com base no ID inicial
  const selectedItem = items.find(item => item.id === initialSelectedId);

  // Sincroniza o termo de busca com o item selecionado
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.name);
    } else if (initialSelectedId === null) {
      setSearchTerm('');
    }
  }, [selectedItem, initialSelectedId]);

  // Filtra os itens com base no termo de busca
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Limita a 10 resultados

  const handleSelect = (item: SelectItem) => {
    setSearchTerm(item.name);
    onSelect(item.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSelect(null);
    setIsOpen(false);
  };

  // Fecha o dropdown ao clicar fora
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Se o usuário digitou algo mas não selecionou, e não havia item inicial, limpa o campo
        if (!selectedItem && searchTerm.trim() !== '') {
            setSearchTerm('');
            onSelect(null);
        }
        // Se o usuário digitou algo mas não selecionou, e havia item inicial, restaura o nome
        if (selectedItem && searchTerm.trim() !== selectedItem.name) {
            setSearchTerm(selectedItem.name);
        }
      }
    },
    [selectedItem, searchTerm, onSelect]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            // Limpa a seleção se o usuário começar a digitar
            if (selectedItem && e.target.value !== selectedItem.name) {
                onSelect(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:border-black"
          placeholder={placeholder}
          aria-label={label}
        />
        {selectedItem ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
            aria-label="Limpar seleção"
          >
            <XCircle className="w-5 h-5" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
      </div>

      {isOpen && searchTerm.length > 0 && filteredItems.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredItems.map(item => (
            <li
              key={item.id}
              onMouseDown={(e) => { // Usar onMouseDown para evitar que o onBlur do input feche antes do clique
                e.preventDefault();
                handleSelect(item);
              }}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              <p className="font-medium text-gray-900">{item.name}</p>
              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
            </li>
          ))}
        </ul>
      )}
      {isOpen && searchTerm.length > 0 && filteredItems.length === 0 && (
        <div className="absolute z-20 w-full bg-white border border-gray-300 mt-1 p-2 text-sm text-gray-500 shadow-lg">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
};

export default SearchSelectInput;