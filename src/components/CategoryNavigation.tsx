"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Category } from "../types";
import { categoriesService } from "../services/categories.service";
import { productsService } from "../services/products.service";
import { isDiscountValid } from "../utils/productUtils";

interface CategoryNavigationProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number;
}

// ID fixo para a categoria virtual de Promoção
const PROMOTION_CATEGORY_ID = 99999;

export function CategoryNavigation({ categories, onSelectCategory, selectedCategoryId }: CategoryNavigationProps) {
  const [allCategories, setAllCategories] = useState<Category[]>(categories);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<number, Category[]>>({});
  const [promotionCategory, setPromotionCategory] = useState<Category | null>(null);

  // 1. Carregar subcategorias e a categoria de Promoção
  useEffect(() => {
    const loadData = async () => {
      const subsMap: Record<number, Category[]> = {};
      const fetchedCategories = await categoriesService.getAll();
      setAllCategories(fetchedCategories);

      for (const category of fetchedCategories) {
        if (category && category.id) {
          const subs = await categoriesService.getSubcategories(category.id);
          // Filtra apenas subcategorias visíveis
          subsMap[category.id] = Array.isArray(subs) ? subs.filter(c => c && c.visivel) : [];
        }
      }
      setSubcategoriesMap(subsMap);

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
          order: -1,
        });
      } else {
        setPromotionCategory(null);
      }
    };

    if (categories.length > 0) {
      loadData();
    }
  }, [categories]);

  // 3. Determinar categorias de nível superior
  const allCategory = allCategories.find(c => c.id === 1 && c.visivel);
  
  let topLevelCategories = allCategories.filter(c => 
    (c.parentId === null || c.parentId === undefined) && c.id !== 1 && c.visivel
  );

  if (promotionCategory) {
    topLevelCategories = [promotionCategory, ...topLevelCategories];
  }

  topLevelCategories.sort((a, b) => a.order - b.order);

  const finalCategories = allCategory ? [allCategory, ...topLevelCategories] : topLevelCategories;

  // Função para verificar se a categoria ou qualquer subcategoria dela está selecionada
  const isCategoryActive = useCallback((categoryId: number): boolean => {
    if (selectedCategoryId === categoryId) return true;
    
    // Verifica se a categoria selecionada é descendente da categoria atual
    const subs = subcategoriesMap[categoryId] || [];
    return subs.some(sub => isCategoryActive(sub.id));
  }, [selectedCategoryId, subcategoriesMap]);


  return (
    <div
      className={cn(
        "relative z-0 flex flex-wrap items-center justify-center gap-2 p-1",
        "lg:flex" // Garante que apareça no desktop
      )}
    >
      {finalCategories.map((category) => {
        const hasSubs = (subcategoriesMap[category.id]?.length || 0) > 0;
        const isActive = isCategoryActive(category.id);

        const buttonClasses = cn(
          "flex items-center gap-1 px-4 h-9 rounded-md transition-all duration-200 text-sm font-medium",
          isActive
            ? 'bg-black text-white shadow-md'
            : 'hover:bg-gray-100 text-gray-700 hover:text-black'
        );

        if (hasSubs) {
          return (
            <div key={category.id} className="flex items-center">
              <Button
                onClick={() => onSelectCategory(category.id)}
                variant="ghost"
                className={cn(buttonClasses, "rounded-r-none border-r-0")}
              >
                <span className="font-medium">{category.nome.toUpperCase()}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                        "ml-0.5 h-9 w-8 rounded-l-none transition-all duration-200",
                        isActive
                            ? 'bg-black text-white hover:bg-gray-800'
                            : 'hover:bg-gray-100 text-gray-700 hover:text-black'
                    )}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {subcategoriesMap[category.id].map((sub) => (
                    <DropdownMenuItem 
                        key={sub.id} 
                        onClick={() => onSelectCategory(sub.id)}
                        className={cn(selectedCategoryId === sub.id && 'bg-gray-100 font-semibold')}
                    >
                      {sub.nome}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }

        return (
          <Button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            variant="ghost"
            className={buttonClasses}
          >
            <span className="font-medium">{category.nome.toUpperCase()}</span>
          </Button>
        );
      })}
    </div>
  );
}