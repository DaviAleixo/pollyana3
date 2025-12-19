// Serviço centralizado para manipulação do localStorage
// Facilita manutenção e futura migração para backend real

const STORAGE_KEYS = {
  PRODUCTS: 'pollyana_products',
  CATEGORIES: 'pollyana_categories',
  CLICKS: 'pollyana_clicks',
  STOCK_HISTORY: 'pollyana_stock_history',
  SHIPPING_CONFIG: 'pollyana_shipping_config',
  BANNERS: 'pollyana_banners', // Nova chave para banners
  CUSTOM_LOGO_URL: 'pollyana_custom_logo_url', // Nova chave para a URL da logo
} as const;

// Interface para garantir type-safety nas operações de storage
interface StorageService {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T) => void;
  remove: (key: string) => void;
  clear: () => void;
}

// Implementação do serviço de storage
const storageService: StorageService = {
  // Obter dados do localStorage com parse automático
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  },

  // Salvar dados no localStorage com stringify automático
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  },

  // Remover item do localStorage
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  // Limpar todo o localStorage
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

export { storageService, STORAGE_KEYS };