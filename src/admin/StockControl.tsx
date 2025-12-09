import { useEffect, useState } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { productsService } from '../services/products.service';
import { stockService } from '../services/stock.service';
import { categoriesService } from '../services/categories.service';
import { Product } from '../types';

// Página dedicada para controle rápido de estoque
// Permite adicionar/remover estoque de forma ágil

type SortField = 'nome' | 'estoque';
type SortOrder = 'asc' | 'desc';

export default function StockControl() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = productsService.getAll();
    setProducts(allProducts);

    // Inicializar quantidades padrão
    const initialQuantities: { [key: number]: number } = {};
    allProducts.forEach(p => {
      initialQuantities[p.id] = 1;
    });
    setQuantities(initialQuantities);
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categoriesService.getAll().find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  // Adicionar estoque
  const handleAddStock = (productId: number) => {
    const quantidade = quantities[productId] || 1;
    const success = stockService.addStock(productId, quantidade, 'Entrada rápida');
    if (success) {
      loadProducts();
    }
  };

  // Remover estoque
  const handleRemoveStock = (productId: number) => {
    const quantidade = quantities[productId] || 1;
    const product = products.find(p => p.id === productId);

    if (product && product.estoque < quantidade) {
      alert('Estoque insuficiente');
      return;
    }

    const success = stockService.removeStock(productId, quantidade, 'Saída rápida');
    if (success) {
      loadProducts();
    }
  };

  // Atualizar quantidade
  const handleQuantityChange = (productId: number, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, value)
    }));
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
      comparison = a.estoque - b.estoque;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Controle de Estoque
        </h1>
        <p className="text-gray-600">
          Gerencie entradas e saídas de estoque rapidamente
        </p>
      </div>

      {/* Tabela de estoque */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
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
                    Estoque
                    {sortField === 'estoque' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-center px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  Qtd.
                </th>
                <th className="text-center px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
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

                    {/* Estoque atual */}
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {stockService.isLowStock(product.id) && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`font-bold text-lg ${
                            stockService.isLowStock(product.id)
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {product.estoque}
                        </span>
                      </div>
                    </td>

                    {/* Input de quantidade */}
                    <td className="px-4 sm:px-6 py-4">
                      <input
                        type="number"
                        min="1"
                        value={quantities[product.id] || 1}
                        onChange={(e) =>
                          handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 sm:w-20 border border-gray-300 px-2 py-1 text-center focus:outline-none focus:border-black"
                      />
                    </td>

                    {/* Botões de ação */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAddStock(product.id)}
                          className="bg-green-600 text-white p-2 hover:bg-green-700 transition-colors"
                          title="Adicionar estoque"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStock(product.id)}
                          className="bg-red-600 text-white p-2 hover:bg-red-700 transition-colors"
                          title="Remover estoque"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
        </div>
      </div>
    </div>
  );
}
