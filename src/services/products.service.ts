// Serviço de gerenciamento de produtos
// Centraliza toda a lógica de CRUD de produtos

import { Product } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';
import { categoriesService } from './categories.service'; // Importar categoriesService

class ProductsService {
  // Obter todos os produtos
  getAll(): Product[] {
    const products = storageService.get<Product[]>(STORAGE_KEYS.PRODUCTS);
    // Garante que categoriaId seja sempre um número ao ser recuperado do storage
    const normalizedProducts = products ? products.map(p => ({
      ...p,
      categoriaId: typeof p.categoriaId === 'string' ? parseInt(p.categoriaId, 10) : p.categoriaId
    })) : [];
    console.log('ProductsService.getAll() - Retrieved products (normalized):', normalizedProducts?.map(p => ({ id: p.id, nome: p.nome, categoriaId: p.categoriaId })));
    return normalizedProducts;
  }

  // Obter apenas produtos visíveis (para catálogo público)
  getVisible(): Product[] {
    return this.getAll().filter((p) => p.visivel && p.ativo);
  }

  // Verifica se um produto é um lançamento válido (ativo, marcado como lançamento e não expirado)
  private isLaunchValid(product: Product): boolean {
    if (!product.isLaunch || !product.ativo || !product.visivel) {
      return false;
    }
    if (product.launchExpiresAt) {
      const expirationDate = new Date(product.launchExpiresAt);
      if (expirationDate < new Date()) {
        return false; // Lançamento expirado
      }
    }
    return true;
  }

  // Obter produtos de lançamento válidos, ordenados por ID (mais recente primeiro)
  getLaunches(): Product[] {
    const allProducts = this.getAll();
    const validLaunches = allProducts.filter(this.isLaunchValid);

    // Ordenar por ID decrescente (assumindo que IDs maiores são mais recentes)
    validLaunches.sort((a, b) => b.id - a.id);

    return validLaunches;
  }

  // Obter produto por ID
  getById(id: number): Product | undefined {
    const products = this.getAll();
    return products.find((p) => p.id === id);
  }

  // Criar novo produto
  create(productData: Omit<Product, 'id'>): Product {
    const products = this.getAll();
    const newId = Math.max(...products.map((p) => p.id), 0) + 1;

    const newProduct: Product = {
      id: newId,
      ...productData,
    };

    products.push(newProduct);
    storageService.set(STORAGE_KEYS.PRODUCTS, products);

    return newProduct;
  }

  // Atualizar produto existente
  update(id: number, productData: Partial<Product>): Product | null {
    const products = this.getAll();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) return null;

    products[index] = { ...products[index], ...productData };
    storageService.set(STORAGE_KEYS.PRODUCTS, products);

    return products[index];
  }

  // Excluir produto
  delete(id: number): boolean {
    const products = this.getAll();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) return false;

    storageService.set(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  }

  // Alternar status ativo
  toggleActive(id: number): Product | null {
    const product = this.getById(id);
    if (!product) return null;

    return this.update(id, { ativo: !product.ativo });
  }

  // Alternar visibilidade
  toggleVisible(id: number): Product | null {
    const product = this.getById(id);
    if (!product) return null;

    return this.update(id, { visivel: !product.visivel });
  }

  // Obter produtos por categoria (incluindo subcategorias)
  getByCategory(categoryId: number): Product[] {
    const allProducts = this.getAll();
    const categoryAndDescendants = categoriesService.getDescendants(categoryId);
    const categoryIdsToFilter = categoryAndDescendants.map(c => c.id);

    const filtered = allProducts.filter((p) => {
      return categoryIdsToFilter.includes(p.categoriaId);
    });
    console.log(`ProductsService.getByCategory(${categoryId}) - Found ${filtered.length} products.`);
    return filtered;
  }

  // Inicializar produtos mockados
  initialize(mockProducts: Omit<Product, 'id'>[]): void {
    const existing = storageService.get<Product[]>(STORAGE_KEYS.PRODUCTS);
    if (!existing || existing.length === 0) {
      const products = mockProducts.map((p, index) => ({
        ...p,
        id: index + 1,
      }));
      storageService.set(STORAGE_KEYS.PRODUCTS, products);
    }
  }
}

export const productsService = new ProductsService();