// Serviço de gerenciamento de banners
// Centraliza toda a lógica de CRUD de banners

import { Banner, BannerLinkType } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';

const BANNER_STORAGE_KEY = 'pollyana_banners';

class BannersService {
  // Obter todos os banners, opcionalmente filtrando por visibilidade e ordenando
  getAll(onlyVisible: boolean = false): Banner[] {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    let filteredBanners = banners;

    if (onlyVisible) {
      filteredBanners = banners.filter(banner => banner.isVisible);
    }

    // Sempre ordenar por 'order'
    return filteredBanners.sort((a, b) => a.order - b.order);
  }

  // Obter banner por ID
  getById(id: number): Banner | undefined {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    return banners.find(banner => banner.id === id);
  }

  // Criar novo banner
  create(bannerData: Omit<Banner, 'id'>): Banner {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    const newId = Math.max(...banners.map(b => b.id), 0) + 1;

    const newBanner: Banner = {
      id: newId,
      ...bannerData,
      isVisible: bannerData.isVisible !== undefined ? bannerData.isVisible : true, // Default to visible
      order: bannerData.order !== undefined ? bannerData.order : banners.length + 1, // Default to last order
    };

    banners.push(newBanner);
    storageService.set(BANNER_STORAGE_KEY, banners);
    return newBanner;
  }

  // Atualizar banner existente
  update(id: number, bannerData: Partial<Banner>): Banner | null {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    const index = banners.findIndex(b => b.id === id);

    if (index === -1) return null;

    banners[index] = { ...banners[index], ...bannerData };
    storageService.set(BANNER_STORAGE_KEY, banners);
    return banners[index];
  }

  // Excluir banner
  delete(id: number): boolean {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    const filtered = banners.filter(b => b.id !== id);

    if (filtered.length === banners.length) return false;

    storageService.set(BANNER_STORAGE_KEY, filtered);
    return true;
  }

  // Alternar visibilidade de um banner
  toggleVisibility(id: number): Banner | null {
    const banners = storageService.get<Banner[]>(BANNER_STORAGE_KEY) || [];
    const index = banners.findIndex(b => b.id === id);

    if (index === -1) return null;

    banners[index] = { ...banners[index], isVisible: !banners[index].isVisible };
    storageService.set(BANNER_STORAGE_KEY, banners);
    return banners[index];
  }

  // Inicializar banners se não existirem
  initialize(): void {
    const existing = storageService.get<Banner[]>(BANNER_STORAGE_KEY);
    if (!existing) {
      storageService.set(BANNER_STORAGE_KEY, []);
    }
  }
}

export const bannersService = new BannersService();