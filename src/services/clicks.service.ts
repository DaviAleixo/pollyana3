// Serviço de rastreamento de cliques
// Gerencia estatísticas de cliques em produtos usando Supabase

import { ClickStats } from '../types';
import { supabase } from '../lib/supabase';

class ClicksService {
  // Obter todas as estatísticas de cliques
  async getAll(): Promise<ClickStats> {
    const { data, error } = await supabase
      .from('clicks')
      .select('*');

    if (error) {
      console.error('Erro ao buscar cliques:', error);
      return {};
    }

    const clicks: ClickStats = {};
    if (data) {
      data.forEach(row => {
        clicks[row.product_id] = {
          clicks: row.clicks,
        };
      });
    }

    return clicks;
  }

  // Obter cliques de um produto específico
  async getByProduct(productId: number): Promise<number> {
    const { data, error } = await supabase
      .from('clicks')
      .select('clicks')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar cliques do produto:', error);
      return 0;
    }

    return data?.clicks || 0;
  }

  // Registrar clique em um produto
  async registerClick(productId: number): Promise<void> {
    const { data: existing } = await supabase
      .from('clicks')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('clicks')
        .update({ clicks: existing.clicks + 1 })
        .eq('product_id', productId);
    } else {
      await supabase
        .from('clicks')
        .insert({ product_id: productId, clicks: 1 });
    }
  }

  // Resetar cliques de um produto
  async resetProduct(productId: number): Promise<void> {
    await supabase
      .from('clicks')
      .delete()
      .eq('product_id', productId);
  }

  // Resetar todos os cliques
  async resetAll(): Promise<void> {
    await supabase
      .from('clicks')
      .delete()
      .neq('id', 0);
  }

  // Inicializar cliques se não existirem
  async initialize(): Promise<void> {
  }
}

export const clicksService = new ClicksService();
