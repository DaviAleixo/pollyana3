import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import { categoriesService } from '../services/categories.service'; // Importar o serviço de categorias

interface CategoryNavbarProps {
  categories: Category[]; // Agora recebe todas as categorias visíveis
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

export default function CategoryNavbar({ categories, onSelectCategory, selectedCategoryId }: CategoryNavbarProps) {
  // Filtra apenas categorias visíveis e de nível superior (parentId === null)
  // A categoria "Todos" (id: 1) é tratada separadamente
  const topLevelCategories = categories
    .filter(c => c.visivel && c.parentId === null && c.id !== 1)
    .sort((a, b) => a.order - b.order);

  const allCategory = categories.find(c => c.id === 1 && c.visivel);

  return (
    <div className="hidden lg:block fixed top-[72px] left-0 w-full bg-black z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav>
          <ul className="flex justify-center space-x-8">
            {allCategory && (
              <li>
                <button
                  onClick={() => onSelectCategory(allCategory.id)}
                  className={`text-white text-sm font-medium uppercase tracking-wide hover:text-gray-300 transition-colors border-b-4 border-transparent pb-2
                    ${selectedCategoryId === allCategory.id ? 'border-white' : 'hover:border-white transition-colors duration-300'}`}
                >
                  {allCategory.nome}
                </button>
              </li>
            )}
            {topLevelCategories.map((category) => {
              const subcategories = categoriesService.getSubcategories(category.id).filter(c => c.visivel);
              const hasSubcategories = subcategories.length > 0;

              return (
                <li key={category.id} className="relative group">
                  <button
                    onClick={() => onSelectCategory(category.id)}
                    className={`text-white text-sm font-medium uppercase tracking-wide hover:text-gray-300 transition-colors border-b-4 border-transparent pb-2
                      ${selectedCategoryId === category.id ? 'border-white' : 'hover:border-white transition-colors duration-300'}`}
                  >
                    {category.nome}
                  </button>
                  {hasSubcategories && (
                    <ul className="absolute top-full left-0 pt-2 w-48 bg-white text-black shadow-lg hidden group-hover:block">
                      {subcategories.map((subcat) => (
                        <li key={subcat.id}>
                          <button
                            onClick={() => onSelectCategory(subcat.id)}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors`}
                          >
                            {subcat.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}