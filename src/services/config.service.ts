import { AppConfig } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_CONFIG: AppConfig = {
  logoUrl: '/attached_assets/WhatsApp_Image_2025-11-25_at_15.53.40-removebg-preview_1765314447113.png',
};

class ConfigService {
  // Obtém as configurações globais
  async getConfig(): Promise<AppConfig> {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações globais:', error);
      return DEFAULT_CONFIG;
    }

    if (!data) {
      return DEFAULT_CONFIG;
    }

    return {
      logoUrl: data.logo_url || DEFAULT_CONFIG.logoUrl,
    };
  }

  // Atualiza as configurações globais
  async updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
    const currentConfig = await this.getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };

    const dbData = {
      logo_url: updatedConfig.logoUrl,
    };

    const { data: existing } = await supabase
      .from('app_config')
      .select('*')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('app_config')
        .update(dbData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('app_config')
        .insert(dbData);
    }

    return updatedConfig;
  }

  async initialize(): Promise<void> {
    // Inicializa com o valor padrão se não houver nada
    await this.getConfig();
  }
}

export const configService = new ConfigService();