// Inicialização de dados mock
// Migra produtos existentes e configura dados iniciais

import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { clicksService } from '../services/clicks.service';
import { stockService } from '../services/stock.service';
import { shippingService } from '../services/shipping.service';
import { bannersService } from '../services/banners.service'; // Novo import
import { Product, Banner, Category } from '../types'; // Novo import de Banner e Category

// Categorias mockadas com hierarquia
const mockCategories: Omit<Category, 'id'>[] = [
  // Categoria padrão "Todos" é inicializada pelo serviço
  { nome: 'Roupas', visivel: true, parentId: null, slug: 'roupas', description: 'Vestuário em geral', order: 1 },
  { nome: 'Camisetas', visivel: true, parentId: 2, slug: 'camisetas', description: 'Camisetas de diversos estilos', order: 0 }, // parentId 2 = Roupas
  { nome: 'Tamanho Único', visivel: true, parentId: 3, slug: 'tamanho-unico', description: 'Camisetas de tamanho único', order: 0 }, // parentId 3 = Camisetas
  { nome: 'Calças', visivel: true, parentId: 2, slug: 'calcas', description: 'Calças jeans, sociais e outras', order: 1 }, // parentId 2 = Roupas
  { nome: 'Jeans', visivel: true, parentId: 5, slug: 'jeans', description: 'Calças e shorts jeans', order: 0 }, // parentId 5 = Calças
  { nome: 'Acessórios', visivel: true, parentId: null, slug: 'acessorios', description: 'Bolsas, cintos, bijuterias', order: 2 },
  { nome: 'Bonés', visivel: true, parentId: 7, slug: 'bones', description: 'Bonés e chapéus', order: 0 }, // parentId 7 = Acessórios
  { nome: 'Aba Curva', visivel: true, parentId: 8, slug: 'aba-curva', description: 'Bonés com aba curva', order: 0 }, // parentId 8 = Bonés
  { nome: 'Vestidos', visivel: true, parentId: 2, slug: 'vestidos', description: 'Vestidos de todos os comprimentos', order: 2 }, // parentId 2 = Roupas
];

// Produtos originais do catálogo público
const mockProducts: Omit<Product, 'id'>[] = [
  {
    nome: 'Blusa Oversized Básica',
    preco: 89.90,
    descricao: 'Conforto e estilo para o dia a dia',
    imagem: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 10,
    // Exemplo de desconto por porcentagem
    discountActive: true,
    discountType: 'percentage',
    discountValue: 20, // 20% de desconto
    discountExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expira em 7 dias
  },
  {
    nome: 'Vestido Midi Minimalista',
    preco: 159.90,
    descricao: 'Elegância atemporal em corte reto',
    imagem: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 10, // Categoria: Vestidos
    ativo: true,
    visivel: true,
    estoque: 8,
    // Exemplo de desconto por valor fixo
    discountActive: true,
    discountType: 'fixed',
    discountValue: 30.00, // R$30 de desconto
    discountExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Expira em 3 dias
  },
  {
    nome: 'Calça Wide Leg Premium',
    preco: 189.90,
    descricao: 'Modelagem perfeita e sofisticada',
    imagem: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 6, // Categoria: Calças
    ativo: true,
    visivel: true,
    estoque: 12,
  },
  {
    nome: 'Body Canelado Essencial',
    preco: 69.90,
    descricao: 'Peça básica indispensável',
    imagem: 'https://images.pexels.com/photos/1936854/pexels-photo-1936854.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 15,
    // Exemplo de desconto que expira em breve (para testar a contagem regressiva de horas/minutos)
    discountActive: true,
    discountType: 'percentage',
    discountValue: 15,
    discountExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // Expira em 2h 30m
  },
  {
    nome: 'Blazer Alfaiataria Chic',
    preco: 249.90,
    descricao: 'Poder e elegância em cada detalhe',
    imagem: 'https://images.pexels.com/photos/914668/pexels-photo-914668.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 2, // Categoria: Roupas (geral)
    ativo: true,
    visivel: true,
    estoque: 3,
  },
  {
    nome: 'Saia Lápis Classic',
    preco: 119.90,
    descricao: 'Clássico que nunca sai de moda',
    imagem: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 2, // Categoria: Roupas (geral)
    ativo: true,
    visivel: true,
    estoque: 6,
  },
  {
    nome: 'Conjunto Moletom Premium',
    preco: 199.90,
    descricao: 'Conforto premium com estilo',
    imagem: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 4,
  },
  {
    nome: 'Camisa Social Estruturada',
    preco: 139.90,
    descricao: 'Sofisticação para todas as ocasiões',
    imagem: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 9,
  },
  {
    nome: 'Regata Básica Premium',
    preco: 49.90,
    descricao: 'Essencial para compor looks',
    imagem: 'https://images.pexels.com/photos/1936854/pexels-photo-1936854.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 20,
  },
  {
    nome: 'Calça Alfaiataria Reta',
    preco: 169.90,
    descricao: 'Corte impecável e elegante',
    imagem: 'https://images.pexels.com/photos/914668/pexels-photo-914668.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 6, // Categoria: Calças
    ativo: true,
    visivel: true,
    estoque: 7,
  },
  {
    nome: 'Vestido Tubinho Atemporal',
    preco: 179.90,
    descricao: 'Peça versátil e sofisticada',
    imagem: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 10, // Categoria: Vestidos
    ativo: true,
    visivel: true,
    estoque: 5,
  },
  {
    nome: 'Tricot Gola Alta Essential',
    preco: 129.90,
    descricao: 'Conforto e elegância em malha',
    imagem: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=format&fit=crop&w=600&q=80',
    categoriaId: 4, // Categoria: Camisetas
    ativo: true,
    visivel: true,
    estoque: 11,
  },
];

// Banners mockados para inicialização
const mockBanners: Omit<Banner, 'id'>[] = [
  {
    imageUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    textOverlay: 'NOVA COLEÇÃO DE VERÃO!',
    isVisible: true,
    order: 1,
    linkType: 'category',
    linkedCategoryId: 2, // Link para a categoria 'Roupas'
  },
  {
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    textOverlay: 'PROMOÇÃO RELÂMPAGO!',
    isVisible: true,
    order: 2,
    linkType: 'product',
    linkedProductId: 2, // Link para 'Vestido Midi Minimalista'
  },
  {
    imageUrl: 'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    textOverlay: 'Siga-nos no Instagram!',
    isVisible: true,
    order: 3,
    linkType: 'external',
    externalUrl: 'https://www.instagram.com/pollyanabasicchic/',
  },
  {
    imageUrl: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    textOverlay: 'Conforto e Estilo',
    isVisible: false, // Este banner não será visível por padrão
    order: 4,
    linkType: 'informational',
  },
];

// Função para inicializar todos os dados
export function initializeData(): void {
  // Inicializar categorias (incluindo categoria padrão "Todos")
  categoriesService.initialize();
  const existingCategories = categoriesService.getAll();
  if (existingCategories.length <= 1) { // Se só tiver a categoria "Todos"
    mockCategories.forEach(cat => categoriesService.create(cat));
  }

  // Inicializar produtos com dados mock
  productsService.initialize(mockProducts);

  // Inicializar sistema de cliques
  clicksService.initialize();

  // Inicializar sistema de estoque
  stockService.initialize();

  // Inicializar configurações de frete
  shippingService.initialize();

  // Inicializar banners
  bannersService.initialize();
  const existingBanners = bannersService.getAll(false); // Pega todos os banners para verificar se já existem
  if (existingBanners.length === 0) {
    mockBanners.forEach(banner => bannersService.create(banner));
  }

  console.log('Dados inicializados com sucesso!');
}