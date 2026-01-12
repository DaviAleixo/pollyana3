// Inicialização de dados mock
// Migra produtos existentes e configura dados iniciais

import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { clicksService } from '../services/clicks.service';
import { stockService } from '../services/stock.service';
import { shippingService } from '../services/shipping.service';
import { bannersService } from '../services/banners.service';
import { configService } from '../services/config.service'; // Importar novo serviço

// ===================================================================
// PROJETO ZERADO PARA O CLIENTE - SEM DADOS DE TESTE
// ===================================================================
// O cliente irá cadastrar suas próprias categorias, produtos e banners

// Função para inicializar serviços básicos (sem inserir dados)
export async function initializeData(): Promise<void> {
  // Inicializa apenas as estruturas necessárias dos serviços
  await categoriesService.initialize();
  await clicksService.initialize();
  await stockService.initialize();
  await shippingService.initialize();
  await bannersService.initialize();
  await configService.initialize(); // Inicializa o serviço de configuração

  // NÃO insere produtos, categorias ou banners de teste
  // O banco fica zerado para o cliente começar do zero

  console.log('✅ Serviços inicializados - Banco zerado para o cliente!');
}

// ===================================================================
// DADOS DE EXEMPLO COMENTADOS (PARA REFERÊNCIA FUTURA)
// ===================================================================
// Caso precise reativar dados de teste no futuro, descomente abaixo:

/*
import { Product, Banner, Category } from '../types';

const mockCategories: Omit<Category, 'id'>[] = [
  { nome: 'Roupas', visivel: true, parentId: null, slug: 'roupas', description: 'Vestuário em geral', order: 1 },
  { nome: 'Camisetas', visivel: true, parentId: 2, slug: 'camisetas', description: 'Camisetas de diversos estilos', order: 0 },
  { nome: 'Tamanho Único', visivel: true, parentId: 3, slug: 'tamanho-unico', description: 'Camisetas de tamanho único', order: 0 },
  { nome: 'Calças', visivel: true, parentId: 2, slug: 'calcas', description: 'Calças jeans, sociais e outras', order: 1 },
  { nome: 'Jeans', visivel: true, parentId: 5, slug: 'jeans', description: 'Calças e shorts jeans', order: 0 },
  { nome: 'Acessórios', visivel: true, parentId: null, slug: 'acessorios', description: 'Bolsas, cintos, bijuterias', order: 2 },
  { nome: 'Bonés', visivel: true, parentId: 7, slug: 'bones', description: 'Bonés e chapéus', order: 0 },
  { nome: 'Aba Curva', visivel: true, parentId: 8, slug: 'aba-curva', description: 'Bonés com aba curva', order: 0 },
  { nome: 'Vestidos', visivel: true, parentId: 2, slug: 'vestidos', description: 'Vestidos de todos os comprimentos', order: 2 },
];

const mockProducts: Omit<Product, 'id'>[] = [
  {
    nome: 'Blusa Oversized Básica',
    preco: 89.90,
    descricao: 'Conforto e estilo para o dia a dia',
    imagem: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4,
    ativo: true,
    visivel: true,
    estoque: 10,
    discountActive: true,
    discountType: 'percentage',
    discountValue: 20,
    discountExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // ... outros produtos
];

const mockBanners: Omit<Banner, 'id'>[] = [
  {
    imageUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',
    textOverlay: 'NOVA COLEÇÃO DE VERÃO!',
    isVisible: true,
    order: 1,
    linkType: 'category',
    linkedCategoryId: 2,
  },
  // ... outros banners
];

// Para reativar dados de teste, descomente e use:
export async function initializeDataWithMocks(): Promise<void> {
  await categoriesService.initialize();
  const existingCategories = await categoriesService.getAll();
  if (existingCategories.length <= 1) {
    for (const cat of mockCategories) {
      await categoriesService.create(cat);
    }
  }

  await productsService.initialize(mockProducts);
  await clicksService.initialize();
  await stockService.initialize();
  await shippingService.initialize();
  await configService.initialize(); // Inicializa o serviço de configuração

  await bannersService.initialize();
  const existingBanners = await bannersService.getAll(false);
  if (existingBanners.length === 0) {
    for (const banner of mockBanners) {
      await bannersService.create(banner);
    }
  }

  console.log('Dados de teste inicializados com sucesso!');
}
*/