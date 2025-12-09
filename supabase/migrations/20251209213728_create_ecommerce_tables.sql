/*
  # Criação das Tabelas do E-commerce

  ## Descrição
  Esta migration cria todas as tabelas necessárias para o funcionamento completo
  do sistema de e-commerce, incluindo produtos, categorias, banners, estoque e configurações.

  ## 1. Novas Tabelas

  ### categories
  Armazena as categorias de produtos com suporte a hierarquia (categorias e subcategorias)
  - `id` (serial, primary key)
  - `nome` (text) - Nome da categoria
  - `visivel` (boolean) - Se a categoria está visível no site
  - `parent_id` (integer, nullable) - ID da categoria pai para hierarquia
  - `slug` (text) - URL amigável da categoria
  - `description` (text, nullable) - Descrição opcional
  - `order` (integer) - Ordem de exibição
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### products
  Armazena todos os produtos do catálogo
  - `id` (serial, primary key)
  - `nome` (text) - Nome do produto
  - `preco` (decimal) - Preço do produto
  - `descricao` (text) - Descrição do produto
  - `imagem` (text) - URL da imagem principal
  - `categoria_id` (integer) - Referência à categoria
  - `ativo` (boolean) - Se o produto está ativo
  - `visivel` (boolean) - Se o produto está visível no catálogo
  - `estoque` (integer) - Quantidade em estoque (estoque geral)
  - `tipo_tamanho` (text) - Tipo de tamanho ('padrao' ou 'numeracao')
  - `images_required_for_colors` (boolean) - Se cores requerem imagens
  - `discount_active` (boolean) - Se há desconto ativo
  - `discount_type` (text) - Tipo de desconto ('percentage' ou 'fixed')
  - `discount_value` (decimal) - Valor do desconto
  - `discount_expires_at` (timestamptz) - Quando o desconto expira
  - `is_launch` (boolean) - Se é um produto de lançamento
  - `launch_expires_at` (timestamptz) - Quando o lançamento expira
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### product_colors
  Armazena as cores disponíveis para cada produto
  - `id` (uuid, primary key)
  - `product_id` (integer) - Referência ao produto
  - `nome` (text) - Nome da cor
  - `imagem` (text, nullable) - URL da imagem da cor
  - `is_custom` (boolean) - Se é uma cor personalizada
  - `hex` (text, nullable) - Código hexadecimal da cor
  - `created_at` (timestamptz)

  ### product_variants
  Armazena as variantes de produtos (combinação cor + tamanho) com estoque individual
  - `id` (uuid, primary key)
  - `product_id` (integer) - Referência ao produto
  - `cor` (text) - Nome da cor
  - `tamanho` (text) - Tamanho da variante
  - `estoque` (integer) - Quantidade em estoque desta variante específica
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### banners
  Armazena os banners do carrossel da página inicial
  - `id` (serial, primary key)
  - `image_url` (text) - URL da imagem do banner
  - `text_overlay` (text, nullable) - Texto opcional sobre o banner
  - `is_visible` (boolean) - Se o banner está visível
  - `order` (integer) - Ordem de exibição
  - `link_type` (text) - Tipo de link ('product', 'category', 'external', 'informational')
  - `linked_product_id` (integer, nullable) - ID do produto vinculado
  - `linked_category_id` (integer, nullable) - ID da categoria vinculada
  - `external_url` (text, nullable) - URL externa
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### clicks
  Armazena estatísticas de cliques em produtos
  - `id` (serial, primary key)
  - `product_id` (integer, unique) - Referência ao produto
  - `clicks` (integer) - Número total de cliques
  - `updated_at` (timestamptz)

  ### stock_movements
  Armazena o histórico de movimentações de estoque
  - `id` (serial, primary key)
  - `product_id` (integer) - Referência ao produto
  - `tipo` (text) - Tipo de movimentação ('entrada' ou 'saida')
  - `quantidade` (integer) - Quantidade movimentada
  - `data` (timestamptz) - Data da movimentação
  - `observacao` (text, nullable) - Observação opcional
  - `created_at` (timestamptz)

  ### shipping_config
  Armazena as configurações de frete da loja
  - `id` (serial, primary key)
  - `store_city` (text) - Cidade da loja
  - `local_delivery_cost` (decimal) - Custo de entrega local
  - `standard_shipping_cost` (decimal) - Custo de frete padrão
  - `store_pickup_cost` (decimal) - Custo de retirada na loja
  - `updated_at` (timestamptz)

  ## 2. Segurança (RLS)
  
  Todas as tabelas têm Row Level Security habilitado com as seguintes políticas:
  
  ### Políticas Públicas (Leitura)
  - Qualquer usuário pode visualizar categorias, produtos e banners visíveis
  
  ### Políticas Administrativas (Escrita)
  - Apenas usuários autenticados podem criar, atualizar e deletar dados
  - Clicks e movimentações de estoque são protegidos
*/

-- ============================================================================
-- CATEGORIAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  visivel boolean DEFAULT true,
  parent_id integer REFERENCES categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  description text,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar categorias visíveis"
  ON categories FOR SELECT
  TO public
  USING (visivel = true);

CREATE POLICY "Usuários autenticados podem visualizar todas as categorias"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar categorias"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar categorias"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar categorias"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  preco decimal(10, 2) NOT NULL,
  descricao text NOT NULL,
  imagem text NOT NULL,
  categoria_id integer REFERENCES categories(id) ON DELETE SET DEFAULT DEFAULT 1,
  ativo boolean DEFAULT true,
  visivel boolean DEFAULT true,
  estoque integer DEFAULT 0,
  tipo_tamanho text CHECK (tipo_tamanho IN ('padrao', 'numeracao')),
  images_required_for_colors boolean DEFAULT false,
  discount_active boolean DEFAULT false,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10, 2),
  discount_expires_at timestamptz,
  is_launch boolean DEFAULT false,
  launch_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar produtos visíveis e ativos"
  ON products FOR SELECT
  TO public
  USING (visivel = true AND ativo = true);

CREATE POLICY "Usuários autenticados podem visualizar todos os produtos"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar produtos"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- CORES DE PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  nome text NOT NULL,
  imagem text,
  is_custom boolean DEFAULT false,
  hex text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar cores de produtos"
  ON product_colors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários autenticados podem criar cores"
  ON product_colors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar cores"
  ON product_colors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar cores"
  ON product_colors FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- VARIANTES DE PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  cor text NOT NULL,
  tamanho text NOT NULL,
  estoque integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, cor, tamanho)
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar variantes de produtos"
  ON product_variants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários autenticados podem criar variantes"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar variantes"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar variantes"
  ON product_variants FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- BANNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS banners (
  id serial PRIMARY KEY,
  image_url text NOT NULL,
  text_overlay text,
  is_visible boolean DEFAULT true,
  "order" integer DEFAULT 0,
  link_type text CHECK (link_type IN ('product', 'category', 'external', 'informational')),
  linked_product_id integer REFERENCES products(id) ON DELETE SET NULL,
  linked_category_id integer REFERENCES categories(id) ON DELETE SET NULL,
  external_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar banners visíveis"
  ON banners FOR SELECT
  TO public
  USING (is_visible = true);

CREATE POLICY "Usuários autenticados podem visualizar todos os banners"
  ON banners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar banners"
  ON banners FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- CLIQUES EM PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clicks (
  id serial PRIMARY KEY,
  product_id integer UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  clicks integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar cliques"
  ON clicks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Qualquer pessoa pode inserir cliques"
  ON clicks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Qualquer pessoa pode atualizar cliques"
  ON clicks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id serial PRIMARY KEY,
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer NOT NULL,
  data timestamptz DEFAULT now(),
  observacao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar movimentações"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar movimentações"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- CONFIGURAÇÕES DE FRETE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipping_config (
  id serial PRIMARY KEY,
  store_city text DEFAULT 'Belo Horizonte',
  local_delivery_cost decimal(10, 2) DEFAULT 10.00,
  standard_shipping_cost decimal(10, 2) DEFAULT 25.00,
  store_pickup_cost decimal(10, 2) DEFAULT 0.00,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode visualizar configurações de frete"
  ON shipping_config FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações de frete"
  ON shipping_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem inserir configurações de frete"
  ON shipping_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Inserir categoria padrão "Todos"
INSERT INTO categories (id, nome, visivel, parent_id, slug, description, "order")
VALUES (1, 'Todos', true, NULL, 'todos', 'Todos os produtos do catálogo', 0)
ON CONFLICT (id) DO NOTHING;

-- Inserir configuração de frete padrão
INSERT INTO shipping_config (store_city, local_delivery_cost, standard_shipping_cost, store_pickup_cost)
VALUES ('Belo Horizonte', 10.00, 25.00, 0.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria_id);
CREATE INDEX IF NOT EXISTS idx_products_visivel_ativo ON products(visivel, ativo);
CREATE INDEX IF NOT EXISTS idx_products_launch ON products(is_launch, launch_expires_at);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_visivel ON categories(visivel);
CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_visible_order ON banners(is_visible, "order");

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_config_updated_at ON shipping_config;
CREATE TRIGGER update_shipping_config_updated_at
  BEFORE UPDATE ON shipping_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clicks_updated_at ON clicks;
CREATE TRIGGER update_clicks_updated_at
  BEFORE UPDATE ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();