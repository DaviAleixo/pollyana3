import { useState, useEffect } from 'react';
import { categoriesService } from '../services/categories.service';
import { Category } from '../types';

interface CategoryNavbarProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

export default function CategoryNavbar({ categories, onSelectCategory, selectedCategoryId }: CategoryNavbarProps) {
  const [subcategories, setSubcategories] = useState<Record<number, Category[]>>({});
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  useEffect(() => {
    const loadSubcategories = async () => {
      const subsMap: Record<number, Category[]> = {};

      for (const category of categories) {
        if (category && category.id) {
          const subs = await categoriesService.getSubcategories(category.id);
          subsMap[category.id] = Array.isArray(subs) ? subs.filter(c => c && c.visivel) : [];
        }
      }

      setSubcategories(subsMap);
    };

    if (categories.length > 0) {
      loadSubcategories();
    }
  }, [categories]);

  // Filtra categorias de nível superior, excluindo a categoria padrão 'Todos' (ID 1)
  const topLevelCategories = categories.filter(c => 
    (c.parentId === null || c.parentId === undefined) && c.id !== 1
  );

  // Se não houver categorias de nível superior além de 'Todos', exibe apenas 'TODAS'
  if (!Array.isArray(topLevelCategories) || topLevelCategories.length === 0) {
    return (
      <nav className="fixed top-[88px] lg:top-16 left-0 w-full bg-white border-b border-gray-200 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 h-12 overflow-x-auto">
            <button
              onClick={() => onSelectCategory(1)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategoryId === 1 ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
              }`}
            >
              TODAS
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-[88px] lg:top-16 left-0 w-full bg-white border-b border-gray-200 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center space-x-8 h-12 overflow-x-auto scrollbar-hide">
          {/* Categoria 'TODAS' (ID 1) sempre exibida primeiro */}
          <button
            onClick={() => onSelectCategory(1)}
            className={`text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategoryId === 1 ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
            }`}
          >
            TODAS
          </button>

          {/* Outras categorias de nível superior */}
          {topLevelCategories.map((category) => {
            if (!category || !category.id) return null;

            const categorySubcategories = subcategories[category.id] || [];
            const hasSubs = Array.isArray(categorySubcategories) && categorySubcategories.length > 0;
            const isSelected = selectedCategoryId === category.id;

            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => hasSubs && setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isSelected ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {(category.nome || 'Sem nome').toUpperCase()}
                </button>

                {hasSubs && hoveredCategory === category.id && (
                  <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 shadow-lg rounded-md py-2 min-w-[200px] z-50">
                    {categorySubcategories.map((sub) => {
                      if (!sub || !sub.id) return null;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => onSelectCategory(sub.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {sub.nome || 'Sem nome'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}