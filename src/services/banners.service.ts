// Serviço de gerenciamento de banners
// Centraliza toda a lógica de CRUD de banners usando Supabase

import { Banner } from '../types';
import { supabase } from '../lib/supabase';

// ID fixo para a categoria virtual de Promoção
const PROMOTION_CATEGORY_ID = 99999;

class BannersService {
  // Converte os dados do banco para o formato esperado pela aplicação
  private mapFromDB(dbBanner: any): Banner {
    console.log(`[BannersService] Mapping Banner ID ${dbBanner.id}. Raw link_type: ${dbBanner.link_type}`);
    return {
      id: dbBanner.id,
      imageUrl: dbBanner.image_url,
      textOverlay: dbBanner.text_overlay,
      isVisible: dbBanner.is_visible,
      order: dbBanner.order,
      linkType: dbBanner.link_type,
      // Se o linkedCategoryId for null no DB, mantemos null.
      linkedProductId: dbBanner.linked_product_id,
      linkedCategoryId: dbBanner.linked_category_id === null ? null : dbBanner.linked_category_id,
      externalUrl: dbBanner.external_url,
    };
  }

  // Converte os dados da aplicação para o formato do banco
  private mapToDB(banner: Partial<Banner>): any {
    const dbData: any = {};
    if (banner.imageUrl !== undefined) dbData.image_url = banner.imageUrl;
    if (banner.textOverlay !== undefined) dbData.text_overlay = banner.textOverlay;
    if (banner.isVisible !== undefined) dbData.is_visible = banner.isVisible;
    if (banner.order !== undefined) dbData.order = banner.order;
    if (banner.linkType !== undefined) dbData.link_type = banner.linkType;
    if (banner.linkedProductId !== undefined) dbData.linked_product_id = banner.linkedProductId;
    
    // 🔥 TRATAMENTO DA CATEGORIA VIRTUAL PROMOÇÃO (99999)
    if (banner.linkedCategoryId !== undefined) {
      dbData.linked_category_id = banner.linkedCategoryId === PROMOTION_CATEGORY_ID 
        ? null 
        : banner.linkedCategoryId;
    }
    
    if (banner.externalUrl !== undefined) dbData.external_url = banner.externalUrl;
    return dbData;
  }
  
async getAll(onlyVisible: boolean = false): Promise<Banner[]> {
  let query = supabase
    .from("banners")
    .select("*")
    .order("order", { ascending: true });

  if (onlyVisible) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar banners:", error);
    return [];
  }

  // Mapeamento e re-injeção da ID 99999 para banners que linkam para a promoção
  return Array.isArray(data)
    ? data.map((b) => {
        const mapped = this.mapFromDB(b);
        // Se o linkType for 'category' e linkedCategoryId for null, assumimos que é a promoção
        if (mapped.linkType === 'category' && mapped.linkedCategoryId === null) {
            // Nota: Isso é uma suposição. Se houver outras categorias com linkedCategoryId=null,
            // elas serão tratadas como PROMOTION_CATEGORY_ID.
            // Para evitar isso, o DB deveria ter um campo 'is_promotion_link'.
            // Como não temos, vamos re-injetar 99999 para que o frontend saiba que é a promoção.
            return { ...mapped, linkedCategoryId: PROMOTION_CATEGORY_ID };
        }
        return mapped;
    })
    : [];
}

  // Obter banner por ID
  async getById(id: number): Promise<Banner | undefined> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar banner:", error);
    return undefined;
  }

  if (!data) return undefined;
  
  const mapped = this.mapFromDB(data);
  
  // Re-injetar 99999 se for um link de categoria com ID nula (assumindo que é a promoção)
  if (mapped.linkType === 'category' && mapped.linkedCategoryId === null) {
      return { ...mapped, linkedCategoryId: PROMOTION_CATEGORY_ID };
  }

  return mapped;
}

  // Criar novo banner
  async create(bannerData: Omit<Banner, 'id'>): Promise<Banner | null> {
    const allBanners = await this.getAll();
    const newBanner = this.mapToDB({
      ...bannerData,
      isVisible: bannerData.isVisible !== undefined ? bannerData.isVisible : true,
      order: bannerData.order !== undefined ? bannerData.order : allBanners.length + 1,
    });

    const { data, error } = await supabase
      .from('banners')
      .insert(newBanner)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar banner:', error);
      return null;
    }

    return data ? this.mapFromDB(data) : null;
  }

  // Atualizar banner existente
  async update(id: number, bannerData: Partial<Banner>): Promise<Banner | null> {
    const updateData = this.mapToDB(bannerData);

    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar banner:', error);
      return null;
    }

    return data ? this.mapFromDB(data) : null;
  }

  // Excluir banner
  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar banner:', error);
      return false;
    }

    return true;
  }

  // Alternar visibilidade de um banner
  async toggleVisibility(id: number): Promise<Banner | null> {
    const banner = await this.getById(id);
    if (!banner) return null;

    return this.update(id, { isVisible: !banner.isVisible });
  }

  // Inicializar banners se não existirem
  async initialize(): Promise<void> {
  }
}

export const bannersService = new BannersService();