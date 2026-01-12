import { useEffect, useState, useCallback } from 'react';
import { Plus, Minus, AlertTriangle, Save } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { Product, Category, ProductVariant } from '../types';
import { showError, showSuccess } from '../utils/toast'; // Import toast utilities

type SortField = 'nome' | 'estoque';
type SortOrder = 'asc' | 'desc';

// Interface para rastrear alterações de estoque
interface StockChange {
  productId: number;
  variantId: string;
  newStock: number;
}

export default function StockControlNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [stockChanges, setStockChanges] = useState<StockChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar produtos e categorias
  const loadProducts = useCallback(async () => {
    try {
      const result = await productsService.getAll();

      const array =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

      setProducts(array);
      setStockChanges([]); // Limpa as alterações pendentes após o carregamento
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProducts([]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const list = await categoriesService.getAll();
      setCategories(list);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Pega nome da categoria
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  const getTotalStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      // Aplica as alterações pendentes ao estoque total
      const currentChanges = stockChanges.filter(c => c.productId === product.id);
      
      let total = product.variants.reduce((sum, v) => {
        const change = currentChanges.find(c => c.variantId === v.id);
        return sum + (change ? change.newStock : v.estoque);
      }, 0);

      return total;
    }
    // Se não tiver variantes, o estoque é o principal (não suportado neste componente, mas mantemos a compatibilidade)
    return product.estoque || 0;
  };

  const getVariantStock = (productId: number, variantId: string, initialStock: number): number => {
    const change = stockChanges.find(c => c.productId === productId && c.variantId === variantId);
    return change ? change.newStock : initialStock;
  };

  const updateVariantStock = (productId: number, variantId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return;

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return;

    const currentStock = getVariantStock(productId, variantId, variant.estoque);
    const newStock = Math.max(0, currentStock + delta);

    // Atualiza o estado local de alterações
    setStockChanges(prev => {
      const existingIndex = prev.findIndex(c => c.productId === productId && c.variantId === variantId);
      
      if (existingIndex !== -1) {
        const updatedChanges = [...prev];
        updatedChanges[existingIndex] = { ...updatedChanges[existingIndex], newStock };
        return updatedChanges;
      } else {
        return [...prev, { productId, variantId, newStock }];
      }
    });
  };

  const handleSaveStock = async () => {
    if (stockChanges.length === 0) return;

    setIsSaving(true);
    const productsToUpdate = new Set(stockChanges.map(c => c.productId));

    try {
      for (const productId of productsToUpdate) {
        const product = products.find(p => p.id === productId);
        if (!product || !product.variants) continue;

        const changesForProduct = stockChanges.filter(c => c.productId === productId);
        
        const updatedVariants: ProductVariant[] = product.variants.map(v => {
          const change = changesForProduct.find(c => c.variantId === v.id);
          if (change) {
            return { ...v, estoque: change.newStock };
          }
          return v;
        });

        const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.estoque, 0);

        // Persistir a alteração no produto (variantes e estoque total)
        await productsService.update(productId, {
          variants: updatedVariants,
          estoque: newTotalStock, // CORRIGIDO: Usando newTotalStock
        });
      }

      // Recarregar dados após salvar
      await loadProducts();
      showSuccess('Estoque atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar estoque:', error);
      showError('Erro ao salvar estoque. Verifique o console.');
    } finally {
      setIsSaving(false);
    }
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

    // Usar o estoque atualizado para ordenação
    const stockA = getTotalStock(a);
    const stockB = getTotalStock(b);

    if (sortField === 'nome') {
      comparison = a.nome.localeCompare(b.nome);
    } else if (sortField === 'estoque') {
      comparison = stockA - stockB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleExpand = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const hasPendingChanges = stockChanges.length > 0;

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

      {/* Botão Salvar Alterações */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleSaveStock}
          disabled={!hasPendingChanges || isSaving}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            hasPendingChanges && !isSaving
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-spin" />
              Salvando...
            </div>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações ({stockChanges.length})
            </>
          )}
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 w-8"></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  <button onClick={() => handleSort('nome')} className="flex items-center gap-1 hover:text-black">
                    Produto {sortField === 'nome' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  <button onClick={() => handleSort('estoque')} className="flex items-center gap-1 hover:text-black mx-auto">
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
                                  <th className="px-4 py-2 text-left text-sm font-semibold">Cor</th>
                                  <th className="px-4 py-2 text-left text-sm font-semibold">Tamanho</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold">Estoque</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants!.map((variant) => {
                                  const currentStock = getVariantStock(product.id, variant.id, variant.estoque);
                                  return (
                                    <tr key={variant.id}>
                                      <td className="px-4 py-2 text-sm">{variant.cor}</td>
                                      <td className="px-4 py-2 text-sm">{variant.tamanho}</td>
                                      <td className="px-4 py-2 text-center text-sm">{currentStock}</td>
                                      <td className="px-4 py-2">
                                        <div className="flex justify-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => updateVariantStock(product.id, variant.id, 1)}
                                            className="bg-green-600 text-white p-1.5 hover:bg-green-700 transition-colors"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => updateVariantStock(product.id, variant.id, -1)}
                                            className="bg-red-600 text-white p-1.5 hover:bg-red-700 transition-colors"
                                            disabled={currentStock === 0}
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
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
      
      {/* Legenda */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Estoque baixo (≤ 5 unidades)</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            <span>Adicionar estoque (local)</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-red-600" />
            <span>Remover estoque (local)</span>
          </div>
        </div>
      </div>
    </div>
  );
}