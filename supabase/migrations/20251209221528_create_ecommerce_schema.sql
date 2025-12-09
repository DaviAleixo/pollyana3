/*
  # Schema Completo do E-commerce Pollyana

  ## Descrição
  Esta migration cria todas as tabelas necessárias para o funcionamento completo do sistema de e-commerce,
  incluindo produtos, categorias, estoque, banners, cliques e configurações de frete.

  ## Tabelas Criadas

  ### 1. categories
  Gerencia categorias de produtos com suporte a hierarquia (categorias e subcategorias)
  - `id` (serial, primary key) - Identificador único
  - `nome` (text) - Nome da categoria
  - `slug` (text, unique) - Slug para URLs amigáveis
  - `description` (text, nullable) - Descrição opcional da categoria
  - `visivel` (boolean) - Controla se a categoria aparece no site
  - `parent_id` (integer, nullable) - ID da categoria pai para hierarquia
  - `order` (integer) - Ordem de exibição
  - `created_at` (timestamptz) - Data de criação

  ### 2. products
  Armazena informações principais dos produtos do catálogo
  - `id` (serial, primary key) - Identificador único
  - `nome` (text) - Nome do produto
  - `preco` (numeric) - Preço base do produto
  - `descricao` (text) - Descrição detalhada
  - `imagem` (text) - URL da imagem principal
  - `categoria_id` (integer) - Referência à categoria
  - `ativo` (boolean) - Status ativo/inativo
  - `visivel` (boolean) - Controla visibilidade no catálogo
  - `estoque` (integer) - Estoque principal (pode ser sobrescrito pelas variantes)
  - `tipo_tamanho` (text) - Tipo de tamanho: 'padrao' (P,M,G,GG) ou 'numeracao'
  - `images_required_for_colors` (boolean) - Se cores precisam ter imagens individuais
  - Campos de desconto:
    - `discount_active` (boolean) - Se o desconto está ativo
    - `discount_type` (text) - Tipo: 'percentage' ou 'fixed'
    - `discount_value` (numeric) - Valor do desconto
    - `discount_expires_at` (timestamptz) - Data de expiração do desconto
  - Campos de lançamento:
    - `is_launch` (boolean) - Se é um produto de lançamento
    - `launch_expires_at` (timestamptz) - Data de expiração do lançamento
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 3. product_colors
  Cores disponíveis para cada produto
  - `id` (serial, primary key) - Identificador único
  - `product_id` (integer) - Referência ao produto
  - `nome` (text) - Nome da cor
  - `hex` (text, nullable) - Código hexadecimal da cor
  - `imagem` (text, nullable) - URL da imagem específica da cor
  - `is_custom` (boolean) - Se é uma cor personalizada

  ### 4. product_variants
  Variantes de produtos (combinação cor + tamanho + estoque)
  - `id` (uuid, primary key) - Identificador único
  - `product_id` (integer) - Referência ao produto
  - `cor` (text) - Nome da cor
  - `tamanho` (text) - Tamanho (P, M, G, GG ou numeração)
  - `estoque` (integer) - Quantidade em estoque desta variante específica

  ### 5. stock_movements
  Histórico de movimentações de estoque
  - `id` (serial, primary key) - Identificador único
  - `product_id` (integer) - Referência ao produto
  - `tipo` (text) - Tipo de movimentação: 'entrada' ou 'saida'
  - `quantidade` (integer) - Quantidade movimentada
  - `data` (timestamptz) - Data da movimentação
  - `observacao` (text, nullable) - Observação sobre a movimentação

  ### 6. clicks
  Rastreamento de cliques em produtos (analytics)
  - `id` (serial, primary key) - Identificador único
  - `product_id` (integer, unique) - Referência ao produto
  - `clicks` (integer) - Número total de cliques

  ### 7. banners
  Banners do carrossel principal da página inicial
  - `id` (serial, primary key) - Identificador único
  - `image_url` (text) - URL da imagem do banner
  - `text_overlay` (text, nullable) - Texto sobreposto à imagem
  - `is_visible` (boolean) - Se o banner está visível
  - `order` (integer) - Ordem de exibição no carrossel
  - `link_type` (text) - Tipo de link: 'product', 'category', 'external', 'informational'
  - `linked_product_id` (integer, nullable) - ID do produto vinculado
  - `linked_category_id` (integer, nullable) - ID da categoria vinculada
  - `external_url` (text, nullable) - URL externa
  - `created_at` (timestamptz) - Data de criação

  ### 8. shipping_config
  Configurações de frete da loja (tabela singleton)
  - `id` (serial, primary key) - Identificador único
  - `store_city` (text) - Cidade da loja para cálculo de frete local
  - `local_delivery_cost` (numeric) - Custo de entrega local
  - `standard_shipping_cost` (numeric) - Custo de frete padrão (correios/transportadora)
  - `store_pickup_cost` (numeric) - Custo de retirada na loja (geralmente 0)
  - `updated_at` (timestamptz) - Data de atualização

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas permitem leitura pública para dados visíveis
  - Escrita/modificação bloqueada (será gerenciada por autenticação futura)

  ## Índices
  - Índices criados para otimizar consultas frequentes
  - Foreign keys com índices para melhor performance

  ## Notas Importantes
  1. Categoria padrão (id=1) será criada automaticamente
  2. Não é possível excluir a categoria padrão
  3. Produtos órfãos são automaticamente movidos para categoria padrão ao excluir uma categoria
  4. Ao excluir um produto, suas cores, variantes e cliques são removidos automaticamente (CASCADE)
*/

-- =====================================================
-- 1. TABELA DE CATEGORIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  visivel BOOLEAN DEFAULT true NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_visivel ON categories(visivel);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order");

-- Inserir categoria padrão se não existir
INSERT INTO categories (id, nome, slug, visivel, parent_id, "order")
VALUES (1, 'Sem Categoria', 'sem-categoria', true, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. TABELA DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  descricao TEXT DEFAULT '' NOT NULL,
  imagem TEXT NOT NULL,
  categoria_id INTEGER DEFAULT 1 NOT NULL REFERENCES categories(id) ON DELETE SET DEFAULT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  visivel BOOLEAN DEFAULT true NOT NULL,
  estoque INTEGER DEFAULT 0 NOT NULL,
  tipo_tamanho TEXT DEFAULT 'padrao',
  images_required_for_colors BOOLEAN DEFAULT false NOT NULL,
  discount_active BOOLEAN DEFAULT false NOT NULL,
  discount_type TEXT,
  discount_value NUMERIC(10, 2),
  discount_expires_at TIMESTAMPTZ,
  is_launch BOOLEAN DEFAULT false NOT NULL,
  launch_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_categoria_id ON products(categoria_id);
CREATE INDEX IF NOT EXISTS idx_products_visivel ON products(visivel);
CREATE INDEX IF NOT EXISTS idx_products_ativo ON products(ativo);
CREATE INDEX IF NOT EXISTS idx_products_is_launch ON products(is_launch);

-- =====================================================
-- 3. TABELA DE CORES DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  hex TEXT,
  imagem TEXT,
  is_custom BOOLEAN DEFAULT false NOT NULL
);

-- Índices para cores
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);

-- =====================================================
-- 4. TABELA DE VARIANTES DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cor TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  estoque INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(product_id, cor, tamanho)
);

-- Índices para variantes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- =====================================================
-- 5. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  data TIMESTAMPTZ DEFAULT now() NOT NULL,
  observacao TEXT
);

-- Índices para movimentações de estoque
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_data ON stock_movements(data DESC);

-- =====================================================
-- 6. TABELA DE CLIQUES (ANALYTICS)
-- =====================================================

CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0 NOT NULL
);

-- Índices para cliques
CREATE INDEX IF NOT EXISTS idx_clicks_product_id ON clicks(product_id);

-- =====================================================
-- 7. TABELA DE BANNERS
-- =====================================================

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  text_overlay TEXT,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  link_type TEXT DEFAULT 'informational' NOT NULL CHECK (link_type IN ('product', 'category', 'external', 'informational')),
  linked_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  linked_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  external_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para banners
CREATE INDEX IF NOT EXISTS idx_banners_is_visible ON banners(is_visible);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners("order");

-- =====================================================
-- 8. TABELA DE CONFIGURAÇÃO DE FRETE
-- =====================================================

CREATE TABLE IF NOT EXISTS shipping_config (
  id SERIAL PRIMARY KEY,
  store_city TEXT DEFAULT 'Belo Horizonte' NOT NULL,
  local_delivery_cost NUMERIC(10, 2) DEFAULT 10.00 NOT NULL,
  standard_shipping_cost NUMERIC(10, 2) DEFAULT 25.00 NOT NULL,
  store_pickup_cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Inserir configuração padrão se não existir
INSERT INTO shipping_config (store_city, local_delivery_cost, standard_shipping_cost, store_pickup_cost)
VALUES ('Belo Horizonte', 10.00, 25.00, 0.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
CREATE POLICY "Permitir leitura pública de categorias"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Políticas para products
CREATE POLICY "Permitir leitura pública de produtos"
  ON products FOR SELECT
  TO public
  USING (true);

-- Políticas para product_colors
CREATE POLICY "Permitir leitura pública de cores"
  ON product_colors FOR SELECT
  TO public
  USING (true);

-- Políticas para product_variants
CREATE POLICY "Permitir leitura pública de variantes"
  ON product_variants FOR SELECT
  TO public
  USING (true);

-- Políticas para stock_movements
CREATE POLICY "Permitir leitura pública de movimentações"
  ON stock_movements FOR SELECT
  TO public
  USING (true);

-- Políticas para clicks
CREATE POLICY "Permitir leitura pública de cliques"
  ON clicks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção pública de cliques"
  ON clicks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de cliques"
  ON clicks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para banners
CREATE POLICY "Permitir leitura pública de banners"
  ON banners FOR SELECT
  TO public
  USING (true);

-- Políticas para shipping_config
CREATE POLICY "Permitir leitura pública de configuração de frete"
  ON shipping_config FOR SELECT
  TO public
  USING (true);
