import { useState, useEffect } from 'react';
import { categoriesService } from '../services/categories.service';
import { productsService } from '../services/products.service';
import { isDiscountValid } from '../utils/productUtils';
import { Category } from '../types';

interface CategoryNavbarProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

// ID fixo para a categoria virtual de Promoção
const PROMOTION_CATEGORY_ID = 99999;

export default function CategoryNavbar({ categories, onSelectCategory, selectedCategoryId }: CategoryNavbarProps) {
  const [promotionCategory, setPromotionCategory] = useState<Category | null>(null);

  // Carregar a categoria de Promoção dinamicamente
  useEffect(() => {
    const loadPromotionCategory = async () => {
      const allProducts = await productsService.getVisible();
      const hasDiscountedProducts = allProducts.some(p => isDiscountValid(p));

      if (hasDiscountedProducts) {
        setPromotionCategory({
          id: PROMOTION_CATEGORY_ID,
          nome: 'Promoção',
          visivel: true,
          parentId: null,
          slug: 'promocao',
          order: -1,
        });
      } else {
        setPromotionCategory(null);
      }
    };

    loadPromotionCategory();
  }, [categories]);

  // 1. Categoria 'TODAS' (ID 1)
  const allCategory = categories.find(c => c.id === 1 && c.visivel);

  // 2. Outras categorias de nível superior visíveis (parentId é null ou undefined, e não é ID 1)
  let topLevelCategories = categories.filter(c => 
    (c.parentId === null || c.parentId === undefined) && c.id !== 1 && c.visivel
  );

  // 3. Adiciona a categoria de Promoção se existir
  if (promotionCategory) {
    topLevelCategories = [promotionCategory, ...topLevelCategories];
  }

  // 4. Ordena todas as categorias de nível superior (incluindo Promoção)
  topLevelCategories.sort((a, b) => a.order - b.order);

  // Combina 'TODAS' com as outras categorias
  const finalCategories = allCategory ? [allCategory, ...topLevelCategories] : topLevelCategories;

  if (finalCategories.length === 0) {
    return null;
  }

  return (
    <nav className="fixed top-[88px] lg:top-16 left-0 w-full bg-white border-b border-gray-200 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center space-x-8 h-12 overflow-x-auto scrollbar-hide">
          {finalCategories.map((category) => {
            if (!category || !category.id) return null;

            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`text-sm font-medium transition-colors whitespace-nowrap h-full flex items-center px-2 ${
                  isSelected ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'
                }`}
              >
                {(category.nome || 'Sem nome').toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}