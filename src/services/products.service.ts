// Serviço de gerenciamento de produtos
// Centraliza toda a lógica de CRUD de produtos usando Supabase

import { Product, ProductColor, ProductVariant } from '../types';
import { supabase } from '../lib/supabase';
import { isLaunchValid } from '../utils/productUtils'; // Importar a validação

class ProductsService {
  // Converte os dados do banco para o formato esperado pela aplicação
  private mapFromDB(dbProduct: any, colors?: ProductColor[], variants?: ProductVariant[]): Product {
    return {
      id: dbProduct.id,
      nome: dbProduct.nome,
      preco: parseFloat(dbProduct.preco),
      descricao: dbProduct.descricao,
      imagem: dbProduct.imagem,
      categoriaId: dbProduct.categoria_id,
      ativo: dbProduct.ativo,
      visivel: dbProduct.visivel,
      estoque: dbProduct.estoque,
      tipoTamanho: dbProduct.tipo_tamanho,
      cores: colors,
      variants: variants,
      imagesRequiredForColors: dbProduct.images_required_for_colors,
      discountActive: dbProduct.discount_active,
      discountType: dbProduct.discount_type,
      discountValue: dbProduct.discount_value ? parseFloat(dbProduct.discount_value) : undefined,
      discountExpiresAt: dbProduct.discount_expires_at,
      isLaunch: dbProduct.is_launch,
      launchExpiresAt: dbProduct.launch_expires_at,
    };
  }

  // Converte os dados da aplicação para o formato do banco
  private mapToDB(product: Partial<Product>): any {
    const dbData: any = {};
    if (product.nome !== undefined) dbData.nome = product.nome;
    if (product.preco !== undefined) dbData.preco = product.preco;
    if (product.descricao !== undefined) dbData.descricao = product.descricao;
    if (product.imagem !== undefined) dbData.imagem = product.imagem;
    if (product.categoriaId !== undefined) dbData.categoria_id = product.categoriaId;
    if (product.ativo !== undefined) dbData.ativo = product.ativo;
    if (product.visivel !== undefined) dbData.visivel = product.visivel;
    if (product.estoque !== undefined) dbData.estoque = product.estoque;
    if (product.tipoTamanho !== undefined) dbData.tipo_tamanho = product.tipoTamanho;
    if (product.imagesRequiredForColors !== undefined) dbData.images_required_for_colors = product.imagesRequiredForColors;
    if (product.discountActive !== undefined) dbData.discount_active = product.discountActive;
    if (product.discountType !== undefined) dbData.discount_type = product.discountType;
    if (product.discountValue !== undefined) dbData.discount_value = product.discountValue;
    if (product.discountExpiresAt !== undefined) dbData.discount_expires_at = product.discountExpiresAt;
    if (product.isLaunch !== undefined) dbData.is_launch = product.isLaunch;
    if (product.launchExpiresAt !== undefined) dbData.launch_expires_at = product.launchExpiresAt;
    return dbData;
  }

  // Buscar cores de um produto
  private async getProductColors(productId: number): Promise<ProductColor[]> {
    const { data, error } = await supabase
      .from('product_colors')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      console.error('Erro ao buscar cores do produto:', error);
      return [];
    }

    return data ? data.map(color => ({
      id: color.id,
      nome: color.nome,
      imagem: color.imagem,
      isCustom: color.is_custom,
      hex: color.hex,
    })) : [];
  }

  // Buscar variantes de um produto
  private async getProductVariants(productId: number): Promise<ProductVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      console.error('Erro ao buscar variantes do produto:', error);
      return [];
    }

    return data ? data.map(variant => ({
      id: variant.id,
      cor: variant.cor,
      tamanho: variant.tamanho,
      estoque: variant.estoque,
    })) : [];
  }

  // Obter todos os produtos
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }

    if (!data) return [];

    const products = await Promise.all(
      data.map(async (dbProduct) => {
        const colors = await this.getProductColors(dbProduct.id);
        const variants = await this.getProductVariants(dbProduct.id);
        return this.mapFromDB(dbProduct, colors, variants);
      })
    );

    return products;
  }

  // Obter apenas produtos visíveis (para catálogo público)
  async getVisible(): Promise<Product[]> {
    // Busca todos os produtos e filtra localmente para garantir que o Supabase dummy funcione
    const allProducts = await this.getAll();
    return allProducts.filter(p => p.visivel && p.ativo);
  }

  // Obter produtos de lançamento válidos, ordenados por ID (mais recente primeiro)
  async getLaunches(): Promise<Product[]> {
    // Busca todos os produtos visíveis e filtra localmente
    const visibleProducts = await this.getVisible();
    
    const launches = visibleProducts
      .filter(p => p.isLaunch)
      .filter(isLaunchValid); // Usa a função de utilidade para validar a data

    return launches;
  }

  // Obter produto por ID
  async getById(id: number): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar produto:', error);
      return undefined;
    }

    if (!data) return undefined;

    const colors = await this.getProductColors(data.id);
    const variants = await this.getProductVariants(data.id);

    return this.mapFromDB(data, colors, variants);
  }

  // Criar novo produto
  async create(productData: Omit<Product, 'id'>): Promise<Product | null> {
    const dbProduct = this.mapToDB(productData);

    const { data, error } = await supabase
      .from('products')
      .insert(dbProduct)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return null;
    }

    if (!data) return null;

    if (productData.cores && productData.cores.length > 0) {
      const colorsToInsert = productData.cores.map(color => ({
        product_id: data.id,
        nome: color.nome,
        imagem: color.imagem,
        is_custom: color.isCustom,
        hex: color.hex,
      }));

      await supabase.from('product_colors').insert(colorsToInsert);
    }

    if (productData.variants && productData.variants.length > 0) {
      const variantsToInsert = productData.variants.map(variant => ({
        product_id: data.id,
        cor: variant.cor,
        tamanho: variant.tamanho,
        estoque: variant.estoque,
      }));

      await supabase.from('product_variants').insert(variantsToInsert);
    }

    return await this.getById(data.id) || null;
  }

  // Atualizar produto existente
  async update(id: number, productData: Partial<Product>): Promise<Product | null> {
    const dbProduct = this.mapToDB(productData);

    const { data, error } = await supabase
      .from('products')
      .update(dbProduct)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      return null;
    }

    if (!data) return null;

    if (productData.cores !== undefined) {
      await supabase.from('product_colors').delete().eq('product_id', id);

      if (productData.cores.length > 0) {
        const colorsToInsert = productData.cores.map(color => ({
          product_id: id,
          nome: color.nome,
          imagem: color.imagem,
          is_custom: color.isCustom,
          hex: color.hex,
        }));

        await supabase.from('product_colors').insert(colorsToInsert);
      }
    }

    if (productData.variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id);

      if (productData.variants.length > 0) {
        const variantsToInsert = productData.variants.map(variant => ({
          product_id: id,
          cor: variant.cor,
          tamanho: variant.tamanho,
          estoque: variant.estoque,
        }));

        await supabase.from('product_variants').insert(variantsToInsert);
      }
    }

    return await this.getById(id) || null;
  }

  // Excluir produto
  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      return false;
    }

    return true;
  }

  // Alternar status ativo
  async toggleActive(id: number): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;

    return this.update(id, { ativo: !product.ativo });
  }

  // Alternar visibilidade
  async toggleVisible(id: number): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;

    return this.update(id, { visivel: !product.visivel });
  }

  // Obter produtos por categoria (incluindo subcategorias)
  async getByCategory(categoryId: number): Promise<Product[]> {
    const { categoriesService } = await import('./categories.service');
    const categoryAndDescendants = await categoriesService.getDescendants(categoryId);
    const categoryIdsToFilter = categoryAndDescendants.map(c => c.id);

    // Busca todos os produtos e filtra localmente
    const allProducts = await this.getVisible();

    return allProducts.filter(p => categoryIdsToFilter.includes(p.categoriaId));
  }

  // Inicializar produtos mockados
  async initialize(mockProducts: Omit<Product, 'id'>[]): Promise<void> {
    const existing = await this.getAll();
    if (existing.length === 0) {
      for (const product of mockProducts) {
        await this.create(product);
      }
    }
  }
}

export const productsService = new ProductsService();