// Serviço de gerenciamento de frete
// Gerencia configurações e calcula opções de entrega

import { storageService, STORAGE_KEYS } from './storage.service';
import { ShippingConfig, ShippingAddress, ShippingOption } from '../types';

const SHIPPING_CONFIG_KEY = 'pollyana_shipping_config';

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  storeCity: 'Belo Horizonte', // Cidade padrão da loja
  localDeliveryCost: 10.00,    // Custo padrão para entrega local
  standardShippingCost: 25.00, // Custo padrão para frete fora da cidade
  storePickupCost: 0.00,       // Custo padrão para retirada na loja (geralmente 0)
};

class ShippingService {
  // Obtém as configurações de frete
  getConfig(): ShippingConfig {
    const config = storageService.get<ShippingConfig>(SHIPPING_CONFIG_KEY);
    // Garante que os custos são números, mesmo se o localStorage retornar algo inesperado
    const safeConfig = {
      ...DEFAULT_SHIPPING_CONFIG,
      ...config,
      localDeliveryCost: typeof config?.localDeliveryCost === 'number' ? config.localDeliveryCost : DEFAULT_SHIPPING_CONFIG.localDeliveryCost,
      standardShippingCost: typeof config?.standardShippingCost === 'number' ? config.standardShippingCost : DEFAULT_SHIPPING_CONFIG.standardShippingCost,
      storePickupCost: typeof config?.storePickupCost === 'number' ? config.storePickupCost : DEFAULT_SHIPPING_CONFIG.storePickupCost,
    };
    return safeConfig;
  }

  // Atualiza as configurações de frete
  updateConfig(newConfig: Partial<ShippingConfig>): ShippingConfig {
    const currentConfig = this.getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    storageService.set(SHIPPING_CONFIG_KEY, updatedConfig);
    return updatedConfig;
  }

  // Calcula as opções de frete disponíveis com base no endereço
  calculateShippingOptions(address: ShippingAddress | null): ShippingOption[] {
    const config = this.getConfig();
    const options: ShippingOption[] = [];

    // Opção de Retirada na Loja (sempre disponível)
    options.push({
      type: 'store_pickup',
      label: 'Retirada na Loja',
      cost: config.storePickupCost,
      deliveryTime: 'Pronto em 1 dia útil',
    });

    if (!address) {
      console.log('ShippingService.calculateShippingOptions - No address provided, returning only store pickup:', options);
      return options; // Retorna apenas retirada se não houver endereço
    }

    // Normaliza os nomes das cidades para comparação (ignora acentos e caixa)
    const normalizeCity = (city: string) => city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const storeCityNormalized = normalizeCity(config.storeCity);
    const addressCityNormalized = normalizeCity(address.localidade);

    if (addressCityNormalized === storeCityNormalized) {
      options.push({
        type: 'local',
        label: 'Entrega Local',
        cost: config.localDeliveryCost,
        deliveryTime: '1-2 dias úteis',
      });
    } else {
      options.push({
        type: 'standard',
        label: 'Correios / Transportadora',
        cost: config.standardShippingCost,
        deliveryTime: '5-10 dias úteis',
      });
    }

    console.log('ShippingService.calculateShippingOptions - Generated options:', options);
    return options;
  }

  // Inicializa as configurações de frete se não existirem
  initialize(): void {
    const existing = storageService.get<ShippingConfig>(SHIPPING_CONFIG_KEY);
    if (!existing) {
      storageService.set(SHIPPING_CONFIG_KEY, DEFAULT_SHIPPING_CONFIG);
    }
  }
}

export const shippingService = new ShippingService();