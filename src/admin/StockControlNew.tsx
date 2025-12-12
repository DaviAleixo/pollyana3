import { useEffect, useState } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { Product, Category } from '../types';

type SortField = 'nome' | 'estoque';
type SortOrder = 'asc' | 'desc';

export default function StockControlNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Carregar produtos e categorias
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await productsService.getAll();

      const array =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

      setProducts(array);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const list = await categoriesService.getAll();
      setCategories(list);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setCategories([]);
    }
  };

  // Pega nome da categoria
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  const getTotalStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.estoque, 0);
    }
    return product.estoque || 0;
  };

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

      {/* Tabela */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 w-8"></th>
                <th className="px-4">
                  <button onClick={() => handleSort('nome')}>
                    Produto {sortField === 'nome' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-4">Categoria</th>
                <th className="px-4 text-center">
                  <button onClick={() => handleSort('estoque')}>
                    Estoque Total {sortField === 'estoque' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
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
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          {hasVariants && (
                            <button
                              onClick={() => toggleExpand(product.id)}
                              className="text-lg font-bold"
                            >
                              {isExpanded ? '−' : '+'}
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium">{product.nome}</td>

                        <td className="px-4 py-4">
                          {getCategoryName(product.categoriaId)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {totalStock <= 5 && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`font-bold ${totalStock <= 5 ? 'text-red-600' : ''}`}>
                              {totalStock}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && hasVariants && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 bg-gray-50">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left">Cor</th>
                                  <th className="px-4 py-2 text-left">Tamanho</th>
                                  <th className="px-4 py-2 text-center">Estoque</th>
                                  <th className="px-4 py-2 text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants.map((variant) => (
                                  <tr key={variant.id}>
                                    <td className="px-4 py-2">{variant.cor}</td>
                                    <td className="px-4 py-2">{variant.tamanho}</td>
                                    <td className="px-4 py-2 text-center">{variant.estoque}</td>
                                    <td className="px-4 py-2">
                                      <div className="flex justify-center gap-2">
                                        <button
                                          onClick={() => updateVariantStock(product.id, variant.id, 1)}
                                          className="bg-green-600 text-white p-1.5"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => updateVariantStock(product.id, variant.id, -1)}
                                          className="bg-red-600 text-white p-1.5"
                                          disabled={variant.estoque === 0}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
    </div>
  );
}
