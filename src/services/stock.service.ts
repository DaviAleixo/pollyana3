// Serviço de gerenciamento de estoque
// Controla entradas, saídas e histórico de movimentações usando Supabase

import { StockMovement, StockHistory } from '../types';
import { supabase } from '../lib/supabase';
import { productsService } from './products.service';

class StockService {
  // Obter histórico completo de movimentações
  async getHistory(): Promise<StockHistory> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de estoque:', error);
      return {};
    }

    const history: StockHistory = {};
    if (data) {
      data.forEach(row => {
        const movement: StockMovement = {
          id: row.id,
          productId: row.product_id,
          tipo: row.tipo,
          quantidade: row.quantidade,
          data: row.data,
          observacao: row.observacao,
        };

        if (!history[row.product_id]) {
          history[row.product_id] = [];
        }
        history[row.product_id].push(movement);
      });
    }

    return history;
  }

  // Obter histórico de um produto específico
  async getProductHistory(productId: number): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico do produto:', error);
      return [];
    }

    return data ? data.map(row => ({
      id: row.id,
      productId: row.product_id,
      tipo: row.tipo,
      quantidade: row.quantidade,
      data: row.data,
      observacao: row.observacao,
    })) : [];
  }

  // Registrar entrada de estoque
  async addStock(
    productId: number,
    quantidade: number,
    observacao?: string
  ): Promise<boolean> {
    if (quantidade <= 0) return false;

    const product = await productsService.getById(productId);
    if (!product) return false;

    const newStock = product.estoque + quantidade;
    await productsService.update(productId, { estoque: newStock });

    await this.registerMovement(productId, 'entrada', quantidade, observacao);

    return true;
  }

  // Registrar saída de estoque
  async removeStock(
    productId: number,
    quantidade: number,
    observacao?: string
  ): Promise<boolean> {
    if (quantidade <= 0) return false;

    const product = await productsService.getById(productId);
    if (!product) return false;

    if (product.estoque < quantidade) {
      return false;
    }

    const newStock = product.estoque - quantidade;
    await productsService.update(productId, { estoque: newStock });

    await this.registerMovement(productId, 'saida', quantidade, observacao);

    return true;
  }

  // Registrar movimentação no histórico
  private async registerMovement(
    productId: number,
    tipo: 'entrada' | 'saida',
    quantidade: number,
    observacao?: string
  ): Promise<void> {
    const movement = {
      product_id: productId,
      tipo,
      quantidade,
      data: new Date().toISOString(),
      observacao,
    };

    await supabase
      .from('stock_movements')
      .insert(movement);
  }

  // Verificar se estoque está baixo
  async isLowStock(productId: number, threshold: number = 5): Promise<boolean> {
    const product = await productsService.getById(productId);
    if (!product) return false;
    return product.estoque <= threshold;
  }

  // Obter produtos com estoque baixo
  async getLowStockProducts(threshold: number = 5): Promise<number[]> {
    const products = await productsService.getAll();
    return products
      .filter((p) => p.estoque <= threshold)
      .map((p) => p.id);
  }

  // Inicializar histórico de estoque
  async initialize(): Promise<void> {
  }
}

export const stockService = new StockService();
