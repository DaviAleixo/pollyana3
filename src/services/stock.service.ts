// Serviço de gerenciamento de estoque
// Controla entradas, saídas e histórico de movimentações

import { StockMovement, StockHistory } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';
import { productsService } from './products.service';

class StockService {
  // Obter histórico completo de movimentações
  getHistory(): StockHistory {
    const history = storageService.get<StockHistory>(STORAGE_KEYS.STOCK_HISTORY);
    return history || {};
  }

  // Obter histórico de um produto específico
  getProductHistory(productId: number): StockMovement[] {
    const history = this.getHistory();
    return history[productId] || [];
  }

  // Registrar entrada de estoque
  addStock(
    productId: number,
    quantidade: number,
    observacao?: string
  ): boolean {
    if (quantidade <= 0) return false;

    const product = productsService.getById(productId);
    if (!product) return false;

    // Atualizar estoque do produto
    const newStock = product.estoque + quantidade;
    productsService.update(productId, { estoque: newStock });

    // Registrar movimentação
    this.registerMovement(productId, 'entrada', quantidade, observacao);

    return true;
  }

  // Registrar saída de estoque
  removeStock(
    productId: number,
    quantidade: number,
    observacao?: string
  ): boolean {
    if (quantidade <= 0) return false;

    const product = productsService.getById(productId);
    if (!product) return false;

    // Validar estoque disponível
    if (product.estoque < quantidade) {
      return false;
    }

    // Atualizar estoque do produto
    const newStock = product.estoque - quantidade;
    productsService.update(productId, { estoque: newStock });

    // Registrar movimentação
    this.registerMovement(productId, 'saida', quantidade, observacao);

    return true;
  }

  // Registrar movimentação no histórico
  private registerMovement(
    productId: number,
    tipo: 'entrada' | 'saida',
    quantidade: number,
    observacao?: string
  ): void {
    const history = this.getHistory();
    const productHistory = history[productId] || [];

    // Criar novo ID para movimentação
    const newId = Math.max(...productHistory.map((m) => m.id), 0) + 1;

    const movement: StockMovement = {
      id: newId,
      productId,
      tipo,
      quantidade,
      data: new Date().toISOString(),
      observacao,
    };

    productHistory.push(movement);
    history[productId] = productHistory;

    storageService.set(STORAGE_KEYS.STOCK_HISTORY, history);
  }

  // Verificar se estoque está baixo
  isLowStock(productId: number, threshold: number = 5): boolean {
    const product = productsService.getById(productId);
    if (!product) return false;
    return product.estoque <= threshold;
  }

  // Obter produtos com estoque baixo
  getLowStockProducts(threshold: number = 5): number[] {
    const products = productsService.getAll();
    return products
      .filter((p) => p.estoque <= threshold)
      .map((p) => p.id);
  }

  // Inicializar histórico de estoque
  initialize(): void {
    const existing = storageService.get<StockHistory>(STORAGE_KEYS.STOCK_HISTORY);
    if (!existing) {
      storageService.set(STORAGE_KEYS.STOCK_HISTORY, {});
    }
  }
}

export const stockService = new StockService();
