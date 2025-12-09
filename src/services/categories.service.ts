// Serviço de gerenciamento de categorias
// Centraliza toda a lógica de CRUD de categorias

import { Category } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';
import { productsService } from './products.service'; // Importar productsService para mover produtos

// Categoria padrão "Todos" sempre presente
const DEFAULT_CATEGORY: Category = {
  id: 1,
  nome: 'Todos',
  visivel: true,
  parentId: null,
  slug: 'todos',
  description: 'Todos os produtos do catálogo',
  order: 0, // Sempre a primeira
};

class CategoriesService {
  // Obter todas as categorias, ordenadas e com estrutura plana
  getAll(): Category[] {
    const categories = storageService.get<Category[]>(STORAGE_KEYS.CATEGORIES);
    return categories ? categories.sort((a, b) => a.order - b.order) : [DEFAULT_CATEGORY];
  }

  // Obter categoria por ID
  getById(id: number): Category | undefined {
    const categories = this.getAll();
    return categories.find((cat) => cat.id === id);
  }

  // Obter categorias de nível superior (sem pai)
  getTopLevelCategories(): Category[] {
    return this.getAll().filter(cat => cat.parentId === null);
  }

  // Obter subcategorias de uma categoria pai
  getSubcategories(parentId: number | null): Category[] {
    return this.getAll().filter(cat => cat.parentId === parentId);
  }

  // Gerar slug a partir do nome
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Normaliza caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/--+/g, '-') // Remove hífens duplicados
      .trim(); // Remove espaços em branco no início/fim
  }

  // Criar nova categoria
  create(categoryData: Omit<Category, 'id' | 'slug' | 'order'> & { parentId?: number | null }): Category {
    const categories = this.getAll();
    const newId = Math.max(...categories.map((c) => c.id), 0) + 1;
    const slug = this.generateSlug(categoryData.nome);

    // Determinar a ordem: última entre seus irmãos ou última no nível raiz
    const siblings = this.getSubcategories(categoryData.parentId || null);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;

    const newCategory: Category = {
      id: newId,
      ...categoryData,
      parentId: categoryData.parentId === undefined ? null : categoryData.parentId,
      slug,
      order,
    };

    categories.push(newCategory);
    storageService.set(STORAGE_KEYS.CATEGORIES, categories);

    return newCategory;
  }

  // Atualizar categoria existente
  update(id: number, categoryData: Partial<Omit<Category, 'slug'>>): Category | null {
    const categories = this.getAll();
    const index = categories.findIndex((cat) => cat.id === id);

    if (index === -1) return null;

    // Não permitir edição da categoria padrão "Todos"
    if (id === 1) {
      console.warn('Cannot edit default category');
      return categories[index];
    }

    // Gerar novo slug se o nome for alterado
    const updatedSlug = categoryData.nome ? this.generateSlug(categoryData.nome) : categories[index].slug;

    categories[index] = { ...categories[index], ...categoryData, slug: updatedSlug };
    storageService.set(STORAGE_KEYS.CATEGORIES, categories);

    return categories[index];
  }

  // Excluir categoria
  delete(id: number): boolean {
    // Não permitir exclusão da categoria padrão "Todos"
    if (id === 1) {
      console.warn('Cannot delete default category');
      return false;
    }

    const categories = this.getAll();
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (!categoryToDelete) return false;

    // Mover subcategorias para o pai da categoria excluída (ou para a raiz se a excluída era raiz)
    const children = this.getSubcategories(id);
    children.forEach(child => {
      this.update(child.id, { parentId: categoryToDelete.parentId });
    });

    const filtered = categories.filter((cat) => cat.id !== id);

    if (filtered.length === categories.length) return false;

    storageService.set(STORAGE_KEYS.CATEGORIES, filtered);

    // Mover produtos da categoria excluída para "Todos"
    this.moveProductsToDefault(id);

    return true;
  }

  // Mover produtos de uma categoria para a categoria padrão
  private moveProductsToDefault(categoryId: number): void {
    const products = productsService.getAll(); // Usar o serviço de produtos
    const updated = products.map((product) =>
      product.categoriaId === categoryId
        ? { ...product, categoriaId: 1 }
        : product
    );
    storageService.set(STORAGE_KEYS.PRODUCTS, updated);
  }

  // Reordenar categorias
  reorder(categoryId: number, newOrder: number, newParentId: number | null): void {
    const categories = this.getAll();
    const categoryToMove = categories.find(c => c.id === categoryId);

    if (!categoryToMove) return;

    // Remover a categoria da sua posição atual
    const filteredCategories = categories.filter(c => c.id !== categoryId);

    // Ajustar a ordem dos irmãos antigos
    filteredCategories
      .filter(c => c.parentId === categoryToMove.parentId && c.order > categoryToMove.order)
      .forEach(c => c.order--);

    // Ajustar a ordem dos novos irmãos
    filteredCategories
      .filter(c => c.parentId === newParentId && c.order >= newOrder)
      .forEach(c => c.order++);

    // Atualizar a categoria com a nova ordem e pai
    categoryToMove.order = newOrder;
    categoryToMove.parentId = newParentId;

    // Adicionar a categoria de volta na lista
    filteredCategories.push(categoryToMove);

    // Salvar e reordenar a lista completa
    storageService.set(STORAGE_KEYS.CATEGORIES, filteredCategories.sort((a, b) => a.order - b.order));
  }

  // Obter todos os descendentes de uma categoria (incluindo ela mesma)
  getDescendants(categoryId: number): Category[] {
    const allCategories = this.getAll();
    const descendants: Category[] = [];
    const queue: number[] = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId) {
        const currentCategory = allCategories.find(c => c.id === currentId);
        if (currentCategory) {
          descendants.push(currentCategory);
          const children = allCategories.filter(c => c.parentId === currentId);
          children.forEach(child => queue.push(child.id));
        }
      }
    }
    return descendants;
  }

  // Inicializar categorias padrão se não existirem
  initialize(): void {
    const existing = storageService.get<Category[]>(STORAGE_KEYS.CATEGORIES);
    if (!existing || existing.length === 0) {
      storageService.set(STORAGE_KEYS.CATEGORIES, [DEFAULT_CATEGORY]);
    }
  }
}

export const categoriesService = new CategoriesService();