import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Category } from '../types';
import SidebarCategoryItem from './SidebarCategoryItem'; // Importar o novo componente

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[]; // Agora recebe todas as categorias visíveis
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

export default function Sidebar({ isOpen, onClose, categories, onSelectCategory, selectedCategoryId }: SidebarProps) {
  // Filtra a categoria "Todos" e outras categorias de nível superior visíveis
  const allCategory = categories.find(c => c.id === 1 && c.visivel);
  const otherTopLevelCategories = categories
    .filter(c => c.parentId === null && c.id !== 1 && c.visivel)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Overlay para fechar o sidebar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" // Visível apenas em mobile
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-black">Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {allCategory && (
              <SidebarCategoryItem
                key={allCategory.id}
                category={allCategory}
                level={0}
                allCategories={categories}
                onSelectCategory={onSelectCategory}
                selectedCategoryId={selectedCategoryId}
                onCloseSidebar={onClose}
              />
            )}
            {otherTopLevelCategories.map((category) => (
              <SidebarCategoryItem
                key={category.id}
                category={category}
                level={0}
                allCategories={categories}
                onSelectCategory={onSelectCategory}
                selectedCategoryId={selectedCategoryId}
                onCloseSidebar={onClose}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}