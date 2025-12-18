import { useState, useEffect } from 'react';
import { categoriesService } from '../services/categories.service';
import { productsService } from '../services/products.service'; // Importar productsService
import { isDiscountValid } from '../utils/productUtils'; // Importar utilitário de desconto
import { Category, Product } from '../types';

interface CategoryNavbarProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

// ID fixo para a categoria virtual de Promoção
const PROMOTION_CATEGORY_ID = 99999;

export default function CategoryNavbar({ categories, onSelectCategory, selectedCategoryId }: CategoryNavbarProps) {
  const [subcategories, setSubcategories] = useState<Record<number, Category[]>>({});
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [promotionCategory, setPromotionCategory] = useState<Category | null>(null);

  // 1. Carregar subcategorias e a categoria de Promoção
  useEffect(() => {
    const loadData = async () => {
      const subsMap: Record<number, Category[]> = {};

      for (const category of categories) {
        if (category && category.id) {
          const subs = await categoriesService.getSubcategories(category.id);
          // Filtra apenas subcategorias visíveis
          subsMap[category.id] = Array.isArray(subs) ? subs.filter(c => c && c.visivel) : [];
        }
      }
      setSubcategories(subsMap);

      // 2. Criar Categoria de Promoção Dinâmica
      const allProducts = await productsService.getVisible();
      const hasDiscountedProducts = allProducts.some(p => isDiscountValid(p));

      if (hasDiscountedProducts) {
        setPromotionCategory({
          id: PROMOTION_CATEGORY_ID,
          nome: 'Promoção',
          visivel: true,
          parentId: null,
          slug: 'promocao',
          order: -1, // Garante que apareça antes das categorias normais
        });
      } else {
        setPromotionCategory(null);
      }
    };

    if (categories.length > 0) {
      loadData();
    }
  }, [categories]);

  // Filtra categorias de nível superior visíveis (parentId é null ou undefined)
  let topLevelCategories = categories.filter(c => 
    (c.parentId === null || c.parentId === undefined) && c.visivel
  );

  // Remove a categoria 'Todos' (ID 1) da lista de categorias de nível superior,
  // pois ela será tratada separadamente no início da lista.
  const allCategory = topLevelCategories.find(c => c.id === 1);
  topLevelCategories = topLevelCategories.filter(c => c.id !== 1);

  // Adiciona a categoria de Promoção se existir
  if (promotionCategory) {
    topLevelCategories = [promotionCategory, ...topLevelCategories];
  }

  // Ordena as categorias de nível superior (Promoção vem primeiro devido ao order: -1)
  topLevelCategories.sort((a, b) => a.order - b.order);

  return (
    <nav className="fixed top-[88px] lg:top-16 left-0 w-full bg-white border-b border-gray-200 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-start space-x-8 h-12 overflow-x-auto scrollbar-hide">
          
          {/* Categoria 'TODAS' (ID 1) sempre exibida primeiro */}
          {allCategory && (
            <button
              onClick={() => onSelectCategory(1)}
              className={`text-sm font-medium transition-colors whitespace-nowrap h-full flex items-center px-2 ${
                selectedCategoryId === 1 ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
              }`}
            >
              TODAS
            </button>
          )}

          {/* Outras categorias de nível superior e Promoção */}
          {topLevelCategories.map((category) => {
            if (!category || !category.id) return null;

            const categorySubcategories = subcategories[category.id] || [];
            const hasSubs = Array.isArray(categorySubcategories) && categorySubcategories.length > 0;
            const isSelected = selectedCategoryId === category.id || categorySubcategories.some(sub => sub.id === selectedCategoryId);

            return (
              <div
                key={category.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => hasSubs && setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap h-full flex items-center px-2 ${
                    isSelected ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {(category.nome || 'Sem nome').toUpperCase()}
                </button>

                {/* Dropdown Elegante */}
                {hasSubs && hoveredCategory === category.id && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-0 bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[180px] z-50">
                    {categorySubcategories.map((sub) => {
                      if (!sub || !sub.id) return null;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectCategory(sub.id);
                            setHoveredCategory(null); // Fecha o dropdown após a seleção
                          }}
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