// Inicialização de dados mock
// Migra produtos existentes e configura dados iniciais

import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { clicksService } from '../services/clicks.service';
import { stockService } from '../services/stock.service';
import { shippingService } from '../services/shipping.service';
import { bannersService } from '../services/banners.service';
import { Product, Banner, Category } from '../types';

// ===================================================================
// DADOS DE EXEMPLO
// ===================================================================

const mockCategories: Omit<Category, 'id' | 'slug'>[] = [
  { nome: 'Roupas', visivel: true, parentId: null, order: 1 },
  { nome: 'Camisetas', visivel: true, parentId: 1, order: 0 },
  { nome: 'Tamanho Único', visivel: true, parentId: 2, order: 0 },
  { nome: 'Calças', visivel: true, parentId: 1, order: 1 },
  { nome: 'Jeans', visivel: true, parentId: 4, order: 0 },
  { nome: 'Acessórios', visivel: true, parentId: null, order: 2 },
  { nome: 'Bonés', visivel: true, parentId: 6, order: 0 },
  { nome: 'Aba Curva', visivel: true, parentId: 7, order: 0 },
  { nome: 'Vestidos', visivel: true, parentId: 1, order: 2 },
];

const mockProducts: Omit<Product, 'id' | 'order'>[] = [
  {
    nome: 'Blusa Oversized Básica',
    preco: 89.90,
    descricao: 'Conforto e estilo para o dia a dia',
    imagem: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=600&h=600&q=80',
    categoriaId: 2, // Camisetas
    ativo: true,
    visivel: true,
    estoque: 10,
    tipoTamanho: 'padrao',
    cores: [{ nome: 'Branco', imagem: '', isCustom: false, hex: '#FFFFFF' }],
    variants: [{ id: '1-Branco-P', cor: 'Branco', tamanho: 'P', estoque: 3 }, { id: '1-Branco-M', cor: 'Branco', tamanho: 'M', estoque: 7 }],
    imagesRequiredForColors: false,
    discountActive: true,
    discountType: 'percentage',
    discountValue: 20,
    discountExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLaunch: true,
    launchExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    nome: 'Vestido Midi Floral',
    preco: 159.90,
    descricao: 'Perfeito para eventos diurnos e passeios.',
    imagem: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
    categoriaId: 9, // Vestidos
    ativo: true,
    visivel: true,
    estoque: 5,
    tipoTamanho: 'padrao',
    cores: [{ nome: 'Rosa', imagem: '', isCustom: false, hex: '#EC4899' }],
    variants: [{ id: '2-Rosa-M', cor: 'Rosa', tamanho: 'M', estoque: 5 }],
    imagesRequiredForColors: false,
    discountActive: false,
    isLaunch: true,
    launchExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    nome: 'Calça Jeans Skinny',
    preco: 129.90,
    descricao: 'Jeans de alta qualidade com caimento perfeito.',
    imagem: 'https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
    categoriaId: 5, // Jeans
    ativo: true,
    visivel: true,
    estoque: 20,
    tipoTamanho: 'numeracao',
    cores: [{ nome: 'Azul', imagem: '', isCustom: false, hex: '#3B82F6' }],
    variants: [{ id: '3-Azul-38', cor: 'Azul', tamanho: '38', estoque: 10 }, { id: '3-Azul-40', cor: 'Azul', tamanho: '40', estoque: 10 }],
    imagesRequiredForColors: false,
    discountActive: true,
    discountType: 'fixed',
    discountValue: 30.00,
    discountExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isLaunch: false,
  },
];

const mockBanners: Omit<Banner, 'id'>[] = [
  {
    imageUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&dpr=1',
    textOverlay: 'NOVA COLEÇÃO DE VERÃO!',
    isVisible: true,
    order: 1,
    linkType: 'category',
    linkedCategoryId: 9, // Vestidos
  },
  {
    imageUrl: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=1920&h=600&q=80',
    textOverlay: '20% OFF EM PEÇAS SELECIONADAS',
    isVisible: true,
    order: 2,
    linkType: 'informational',
  },
];

// Função para inicializar serviços básicos (sem inserir dados)
export async function initializeData(): Promise<void> {
  // Inicializa apenas as estruturas necessárias dos serviços
  await categoriesService.initialize();
  await clicksService.initialize();
  await stockService.initialize();
  await shippingService.initialize();
  await bannersService.initialize();

  // NÃO insere produtos, categorias ou banners de teste
  // O banco fica zerado para o cliente começar do zero

  console.log('✅ Serviços inicializados - Banco zerado para o cliente!');
}

// Função para inicializar com dados de mock
export async function initializeDataWithMocks(): Promise<void> {
  await categoriesService.initialize();
  
  // 1. Inicializar Categorias
  const existingCategories = await categoriesService.getAll();
  if (existingCategories.length <= 1) { // Se só tiver a categoria "Todos" (ID 1)
    for (const cat of mockCategories) {
      // O service.create gera o slug e a ordem
      await categoriesService.create(cat);
    }
  }

  // 2. Inicializar Produtos
  const existingProducts = await productsService.getAll();
  if (existingProducts.length === 0) {
    for (const product of mockProducts) {
      // O service.create calcula a ordem
      await productsService.create(product);
    }
  }

  // 3. Inicializar Outros Serviços
  await clicksService.initialize();
  await stockService.initialize();
  await shippingService.initialize();
  await bannersService.initialize();
  
  // 4. Inicializar Banners
  const existingBanners = await bannersService.getAll(false);
  if (existingBanners.length === 0) {
    for (const banner of mockBanners) {
      await bannersService.create(banner);
    }
  }

  console.log('✅ Dados de teste inicializados com sucesso!');
}