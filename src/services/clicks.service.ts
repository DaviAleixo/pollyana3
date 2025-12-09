// Serviço de rastreamento de cliques
// Gerencia estatísticas de cliques em produtos

import { ClickStats } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';

class ClicksService {
  // Obter todas as estatísticas de cliques
  getAll(): ClickStats {
    const clicks = storageService.get<ClickStats>(STORAGE_KEYS.CLICKS);
    return clicks || {};
  }

  // Obter cliques de um produto específico
  getByProduct(productId: number): number {
    const clicks = this.getAll();
    return clicks[productId]?.clicks || 0;
  }

  // Registrar clique em um produto
  registerClick(productId: number): void {
    const clicks = this.getAll();
    const currentClicks = clicks[productId]?.clicks || 0;

    clicks[productId] = {
      clicks: currentClicks + 1,
    };

    storageService.set(STORAGE_KEYS.CLICKS, clicks);
  }

  // Resetar cliques de um produto
  resetProduct(productId: number): void {
    const clicks = this.getAll();
    delete clicks[productId];
    storageService.set(STORAGE_KEYS.CLICKS, clicks);
  }

  // Resetar todos os cliques
  resetAll(): void {
    storageService.set(STORAGE_KEYS.CLICKS, {});
  }

  // Inicializar cliques se não existirem
  initialize(): void {
    const existing = storageService.get<ClickStats>(STORAGE_KEYS.CLICKS);
    if (!existing) {
      storageService.set(STORAGE_KEYS.CLICKS, {});
    }
  }
}

export const clicksService = new ClicksService();
