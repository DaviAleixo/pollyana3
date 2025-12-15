import React from 'react';
import { X, Filter, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import { SortOption } from '../types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

const sortOptionsMap: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'default', label: 'Padrão (Mais Recente)', icon: ListOrdered },
  { value: 'price_asc', label: 'Preço: Mais Barato', icon: ArrowUp },
  { value: 'price_desc', label: 'Preço: Mais Caro', icon: ArrowDown },
  { value: 'alpha_asc', label: 'Nome: A-Z', icon: ListOrdered },
];

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({ isOpen, onClose, sortOption, onSortChange }) => {
  if (!isOpen) return null;

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    onClose();
  };

  return (
    <>
      {/* Overlay (Apenas em Mobile) */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer (Visível em todas as telas, mas com largura fixa) */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-black flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ordenar por</h3>
          <ul className="space-y-2">
            {sortOptionsMap.map((option) => {
              const Icon = option.icon;
              const isSelected = sortOption === option.value;
              return (
                <li key={option.value}>
                  <button
                    onClick={() => handleSortSelect(option.value)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                      isSelected
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default MobileFilterDrawer;