import { AppConfig } from '../types';
import { supabase } from '../lib/supabase';
import { storageService, STORAGE_KEYS } from './storage.service'; // Importar storageService

const DEFAULT_CONFIG: AppConfig = {
  logoUrl: '/attached_assets/WhatsApp_Image_2025-11-25_at_15.53.40-removebg-preview_1765314447113.png',
};

class ConfigService {
  // Obtém as configurações globais
  async getConfig(): Promise<AppConfig> {
    // 1. Tenta obter do cache local (localStorage)
    const cachedLogoUrl = storageService.get<string>(STORAGE_KEYS.CUSTOM_LOGO_URL);
    
    // 2. Busca no Supabase
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações globais:', error);
      // Retorna o cache se houver, senão o padrão
      return { logoUrl: cachedLogoUrl || DEFAULT_CONFIG.logoUrl };
    }

    if (!data) {
      return DEFAULT_CONFIG;
    }

    const logoUrlFromDB = data.logo_url || DEFAULT_CONFIG.logoUrl;
    
    // 3. Atualiza o cache local se o valor do DB for diferente
    if (logoUrlFromDB !== cachedLogoUrl) {
        storageService.set(STORAGE_KEYS.CUSTOM_LOGO_URL, logoUrlFromDB);
    }

    return {
      logoUrl: logoUrlFromDB,
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
    
    // Sincroniza a logo no localStorage para disparar o evento 'storage'
    storageService.set(STORAGE_KEYS.CUSTOM_LOGO_URL, updatedConfig.logoUrl);

    return updatedConfig;
  }

  async initialize(): Promise<void> {
    // Inicializa o cache local com o valor do DB (se houver)
    await this.getConfig();
  }
}

export const configService = new ConfigService();