import { Category } from '../types';
import { CategoryNavigation } from './CategoryNavigation'; // Importar o novo componente

interface CategoryNavbarProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

export default function CategoryNavbar({ categories, onSelectCategory, selectedCategoryId }: CategoryNavbarProps) {
  
  // Se não houver categorias, não renderiza nada
  if (categories.length === 0) {
    return null;
  }

  return (
    <nav className="fixed top-[136px] lg:top-[88px] left-0 w-full bg-white border-b border-gray-200 z-30 hidden lg:block"> {/* Ajustado top-[136px] para mobile e lg:top-[88px] para desktop */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center h-12 overflow-x-auto scrollbar-hide">
          <CategoryNavigation
            categories={categories}
            onSelectCategory={onSelectCategory}
            selectedCategoryId={selectedCategoryId}
          />
        </div>
      </div>
    </nav>
  );
}