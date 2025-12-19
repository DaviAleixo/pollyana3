// Tipos centralizados para toda a aplicação
// Garantem consistência e type-safety

export type SizeType = 'padrao' | 'numeracao';
export type StandardSize = 'P' | 'M' | 'G' | 'GG';
export type DiscountType = 'percentage' | 'fixed'; // Novo tipo para o tipo de desconto

// Novo tipo para o tipo de link do banner
export type BannerLinkType = 'product' | 'category' | 'external' | 'informational';

// Novo tipo para opções de ordenação
export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'alpha_asc';

export interface ProductColor {
  id?: string; // Adicionado id opcional para identificação única no UI
  nome: string;
  imagem?: string; // Tornada opcional
  isCustom: boolean;
  hex?: string; // Adicionado hex property
}

export interface ProductVariant {
  id: string;
  cor: string;
  tamanho: string;
  estoque: number;
}

export interface Product {
  id: number;
  nome: string;
  preco: number;
  descricao: string;
  imagem: string;
  categoriaId: number;
  ativo: boolean;
  visivel: boolean;
  estoque: number;
  tipoTamanho?: SizeType;
  cores?: ProductColor[];
  variants?: ProductVariant[];
  imagesRequiredForColors?: boolean; // Nova propriedade

  // Novas propriedades para desconto
  discountActive?: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  discountExpiresAt?: string; // ISO date string

  // NOVAS PROPRIEDADES PARA LANÇAMENTOS
  isLaunch?: boolean;
  launchExpiresAt?: string; // ISO date string
  // launchOrder?: number; // Ordem de prioridade REMOVIDO
}

export interface StockMovement {
  id: number;
  productId: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  observacao?: string;
}

export interface StockHistory {
  [productId: string]: StockMovement[];
}

export interface Category {
  id: number;
  nome: string;
  visivel: boolean;
  parentId?: number | null; // ID da categoria pai, null para categorias principais
  slug: string; // Slug para URLs amigáveis
  order: number; // Ordem de exibição
}

export interface ClickStats {
  [productId: string]: {
    clicks: number;
  };
}

export interface ProductWithStats extends Product {
  totalClicks: number;
  categoriaNome: string;
}

export interface CartItem {
  id: string; // ID único para o item no carrinho (combinação de produto, cor, tamanho)
  productId: number;
  productName: string;
  productPrice: number; // Preço original do produto
  selectedColorName: string;
  selectedColorHex?: string;
  selectedColorImage?: string;
  selectedSize: string;
  quantity: number;
  stockAvailable: number;

  // Propriedades de desconto no momento da adição ao carrinho
  originalPriceAtAddToCart: number; // Preço original do produto no momento da adição
  discountedPriceAtAddToCart: number; // Preço com desconto no momento da adição
  discountTypeAtAddToCart?: DiscountType;
  discountValueAtAddToCart?: number;
  discountExpiresAtAtAddToCart?: string; // Data de expiração do desconto no momento da adição
}

// Novas interfaces para o sistema de frete
export interface ShippingAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
}

export interface ShippingOption {
  type: 'local' | 'standard' | 'store_pickup'; // Adicionado 'store_pickup'
  label: string;
  cost: number;
  deliveryTime?: string; // Opcional, para futuras melhorias
}

export interface ShippingConfig {
  storeCity: string; // Cidade da loja para frete local
  localDeliveryCost: number;
  standardShippingCost: number;
  storePickupCost: number; // Novo custo para retirada na loja
}

// Nova interface para Banners
export interface Banner {
  id: number;
  imageUrl: string;
  textOverlay?: string; // Texto opcional sobre a imagem
  isVisible: boolean; // Controla se o banner é exibido no carrossel
  order: number; // Ordem de exibição no carrossel
  linkType: BannerLinkType;
  linkedProductId?: number; // ID do produto se linkType for 'product'
  linkedCategoryId?: number; // ID da categoria se linkType for 'category'
  externalUrl?: string; // URL externa se linkType for 'external'
  // desktopImageUrl?: string; // Para futuras melhorias de imagens responsivas específicas
  // mobileImageUrl?: string; // Para futuras melhorias de imagens responsivas específicas
}