import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { Category } from '../types';
import { categoriesService } from '../services/categories.service';

interface SidebarCategoryItemProps {
  category: Category;
  level: number;
  allCategories: Category[]; // Todas as categorias visíveis para encontrar os filhos
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
  onCloseSidebar: () => void;
}

const SidebarCategoryItem: React.FC<SidebarCategoryItemProps> = ({
  category,
  level,
  allCategories,
  onSelectCategory,
  selectedCategoryId,
  onCloseSidebar,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const subcategories = allCategories
    .filter(cat => cat.parentId === category.id && cat.visivel)
    .sort((a, b) => a.order - b.order);

  const hasSubcategories = subcategories.length > 0;

  const handleCategoryClick = () => {
    onSelectCategory(category.id); // Seleciona a categoria no catálogo principal
    if (!hasSubcategories) {
      onCloseSidebar(); // Fecha o sidebar se for uma categoria folha
    } else {
      setIsExpanded(!isExpanded); // Alterna a expansão se tiver subcategorias
    }
  };

  return (
    <li className="py-1">
      <div className="flex items-center">
        {/* Botão de expansão/colapso para subcategorias */}
        {hasSubcategories && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-black transition-colors"
            style={{ marginLeft: `${level * 10}px` }} // Indentação para o botão
            aria-label={isExpanded ? 'Colapsar subcategorias' : 'Expandir subcategorias'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        {/* Espaço para categorias sem subcategorias no mesmo nível de indentação */}
        {!hasSubcategories && level > 0 && (
          <div style={{ marginLeft: `${level * 10 + 24}px` }} className="w-4 h-4"></div> // Ajusta o padding para alinhar
        )}
        {/* Botão da categoria */}
        <button
          onClick={handleCategoryClick}
          className={`flex items-center flex-1 text-left px-4 py-2 rounded-md transition-colors
            ${selectedCategoryId === category.id
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
            }`}
          style={{ marginLeft: hasSubcategories ? '0px' : `${level * 10}px` }} // Ajusta a indentação do botão da categoria
        >
          {/* Removido: <FolderOpen className="w-4 h-4 mr-2" /> */}
          <span className="font-medium">{category.nome}</span>
        </button>
      </div>

      {/* Renderiza subcategorias recursivamente se expandido */}
      {isExpanded && hasSubcategories && (
        <ul className="pl-4"> {/* Indentação para as subcategorias */}
          {subcategories.map((subcat) => (
            <SidebarCategoryItem
              key={subcat.id}
              category={subcat}
              level={level + 1}
              allCategories={allCategories}
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
              onCloseSidebar={onCloseSidebar}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarCategoryItem;