import { useEffect, useState } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { Product, ProductVariant } from '../types';

// Página dedicada para controle de estoque com suporte a variações
// Mostra estoque total + detalhamento por cor e tamanho

type SortField = 'nome' | 'estoque';
type SortOrder = 'asc' | 'desc';

export default function StockControlNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = productsService.getAll();
    setProducts(allProducts);
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categoriesService.getAll().find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  // Calcular estoque total do produto (soma de todas as variações)
  const getTotalStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.estoque, 0);
    }
    return product.estoque || 0;
  };

  // Atualizar estoque de uma variação específica
  const updateVariantStock = (productId: number, variantId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return;

    const updatedVariants = product.variants.map(v =>
      v.id === variantId ? { ...v, estoque: Math.max(0, v.estoque + delta) } : v
    );

    const updatedProduct = {
      ...product,
      variants: updatedVariants,
      estoque: updatedVariants.reduce((sum, v) => sum + v.estoque, 0),
    };

    productsService.update(productId, updatedProduct);
    loadProducts();
  };

  // Ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'nome') {
      comparison = a.nome.localeCompare(b.nome);
    } else if (sortField === 'estoque') {
      comparison = getTotalStock(a) - getTotalStock(b);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Toggle expandir produto
  const toggleExpand = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Controle de Estoque
        </h1>
        <p className="text-gray-600">
          Gerencie estoque por produto e variações (cor × tamanho)
        </p>
      </div>

      {/* Tabela de estoque */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700 w-8"></th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('nome')}
                    className="flex items-center gap-1 hover:text-black"
                  >
                    Produto
                    {sortField === 'nome' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  Categoria
                </th>
                <th className="text-center px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSort('estoque')}
                    className="flex items-center gap-1 hover:text-black mx-auto"
                  >
                    Estoque Total
                    {sortField === 'estoque' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => {
                  const totalStock = getTotalStock(product);
                  const hasVariants = product.variants && product.variants.length > 0;
                  const isExpanded = expandedProduct === product.id;

                  return (
                    <>
                      {/* Linha principal do produto */}
                      <tr key={product.id} className="hover:bg-gray-50">
                        {/* Botão expandir */}
                        <td className="px-4 sm:px-6 py-4">
                          {hasVariants && (
                            <button
                              onClick={() => toggleExpand(product.id)}
                              className="text-gray-600 hover:text-black transition-colors"
                            >
                              <span className="text-lg font-bold">
                                {isExpanded ? '−' : '+'}
                              </span>
                            </button>
                          )}
                        </td>

                        {/* Nome do produto */}
                        <td className="px-4 sm:px-6 py-4">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            {product.nome}
                          </p>
                        </td>

                        {/* Categoria */}
                        <td className="px-4 sm:px-6 py-4 text-gray-700 text-sm">
                          {getCategoryName(product.categoriaId)}
                        </td>

                        {/* Estoque total */}
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {totalStock <= 5 && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`font-bold text-lg ${
                                totalStock <= 5
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {totalStock}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Linhas de variações (expandidas) */}
                      {isExpanded && hasVariants && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 bg-gray-50">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-300">
                                  <tr>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">
                                      Cor
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">
                                      Tamanho
                                    </th>
                                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-700">
                                      Estoque
                                    </th>
                                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-700">
                                      Ações
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {product.variants?.map((variant) => (
                                    <tr key={variant.id} className="hover:bg-white">
                                      <td className="px-4 py-2 text-sm">{variant.cor}</td>
                                      <td className="px-4 py-2 text-sm">{variant.tamanho}</td>
                                      <td className="px-4 py-2 text-center">
                                        <span className="font-semibold text-sm">
                                          {variant.estoque}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            onClick={() => updateVariantStock(product.id, variant.id, 1)}
                                            className="bg-green-600 text-white p-1.5 hover:bg-green-700 transition-colors"
                                            title="Adicionar 1"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => updateVariantStock(product.id, variant.id, -1)}
                                            className="bg-red-600 text-white p-1.5 hover:bg-red-700 transition-colors"
                                            title="Remover 1"
                                            disabled={variant.estoque === 0}
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Estoque baixo (≤ 5 unidades)</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            <span>Adicionar estoque</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-red-600" />
            <span>Remover estoque</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">+</span>
            <span>Expandir para ver variações</span>
          </div>
        </div>
      </div>
    </div>
  );
}
