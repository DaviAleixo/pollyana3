// Serviço de gerenciamento de frete
// Gerencia configurações e calcula opções de entrega usando Supabase

import { ShippingConfig, ShippingAddress, ShippingOption } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  storeCity: 'Belo Horizonte',
  localDeliveryCost: 10.00,
  standardShippingCost: 25.00,
  storePickupCost: 0.00,
};

class ShippingService {
  // Obtém as configurações de frete
  async getConfig(): Promise<ShippingConfig> {
    const { data, error } = await supabase
      .from('shipping_config')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações de frete:', error);
      return DEFAULT_SHIPPING_CONFIG;
    }

    if (!data) {
      return DEFAULT_SHIPPING_CONFIG;
    }

    return {
      storeCity: data.store_city,
      localDeliveryCost: parseFloat(data.local_delivery_cost),
      standardShippingCost: parseFloat(data.standard_shipping_cost),
      storePickupCost: parseFloat(data.store_pickup_cost),
    };
  }

  // Atualiza as configurações de frete
  async updateConfig(newConfig: Partial<ShippingConfig>): Promise<ShippingConfig> {
    const currentConfig = await this.getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };

    const dbData = {
      store_city: updatedConfig.storeCity,
      local_delivery_cost: updatedConfig.localDeliveryCost,
      standard_shipping_cost: updatedConfig.standardShippingCost,
      store_pickup_cost: updatedConfig.storePickupCost,
    };

    const { data: existing } = await supabase
      .from('shipping_config')
      .select('*')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('shipping_config')
        .update(dbData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('shipping_config')
        .insert(dbData);
    }

    return updatedConfig;
  }

  // Calcula as opções de frete disponíveis com base no endereço
  async calculateShippingOptions(address: ShippingAddress | null): Promise<ShippingOption[]> {
    const config = await this.getConfig();
    const options: ShippingOption[] = [];

    options.push({
      type: 'store_pickup',
      label: 'Retirada na Loja',
      cost: config.storePickupCost,
      deliveryTime: 'Pronto em 1 dia útil',
    });

    if (!address) {
      console.log('ShippingService.calculateShippingOptions - No address provided, returning only store pickup:', options);
      return options;
    }

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
  async initialize(): Promise<void> {
  }
}

export const shippingService = new ShippingService();
