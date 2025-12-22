import { useEffect, useState } from 'react';
import { MousePointerClick, RotateCcw } from 'lucide-react';
import { productsService } from '../services/products.service';
import { clicksService } from '../services/clicks.service';
import { ProductWithStats } from '../types';

type SortOrder = 'desc' | 'asc';

export default function Reports() {
  const [productsWithStats, setProductsWithStats] = useState<ProductWithStats[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const products = await productsService.getAll();
      const clicks = await clicksService.getAll(); // 🔥 Adicionado await aqui

      // Garantir que products seja array
      const safeProducts = Array.isArray(products) ? products : [];

      // Combinar produtos com estatísticas de cliques
      const withStats: ProductWithStats[] = safeProducts.map((product) => {
        const clickCount = clicks[product.id]?.clicks || 0;

        return {
          ...product,
          totalClicks: clickCount,
          categoriaNome: '',
        };
      });

      // Ordenar por número de cliques
      withStats.sort((a, b) =>
        sortOrder === 'desc'
          ? b.totalClicks - a.totalClicks
          : a.totalClicks - b.totalClicks
      );

      setProductsWithStats(withStats);

      // Calcular total de cliques
      const total = withStats.reduce((sum, p) => sum + p.totalClicks, 0);
      setTotalClicks(total);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      setProductsWithStats([]);
      setTotalClicks(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleResetAllClicks = async () => {
    if (window.confirm('Tem certeza que deseja zerar *TODAS* as estatísticas de cliques? Esta ação é irreversível.')) {
      setLoading(true);
      try {
        await clicksService.resetAll();
        alert('Estatísticas de cliques zeradas com sucesso!');
        await loadData();
      } catch (error) {
        console.error('Erro ao resetar cliques:', error);
        alert('Erro ao resetar cliques.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
            Relatórios de Cliques
          </h1>
          <p className="text-gray-600">
            Produtos mais clicados no catálogo
          </p>
        </div>
        <button
          onClick={handleResetAllClicks}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors text-sm font-medium"
          disabled={totalClicks === 0}
        >
          <RotateCcw className="w-4 h-4" />
          Resetar Cliques
        </button>
      </div>

      {/* Card de resumo */}
      <div className="bg-black text-white p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MousePointerClick className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-bold">Total de Cliques</h2>
        </div>
        <p className="text-3xl sm:text-4xl font-bold">{totalClicks}</p>
        <p className="text-white/60 text-sm mt-2">
          Em {productsWithStats.length} produto(s)
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  #
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  Produto
                </th>
                <th className="text-center px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-1 hover:text-black mx-auto"
                  >
                    Cliques
                    <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productsWithStats.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">
                    Nenhum dado disponível
                  </td>
                </tr>
              ) : (
                productsWithStats.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 text-gray-500 font-medium text-sm sm:text-base">
                      {index + 1}º
                    </td>

                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {product.nome}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        R$ {product.preco.toFixed(2)}
                      </p>
                    </td>

                    <td className="px-4 sm:px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 sm:px-4 py-2 font-bold text-base sm:text-lg ${
                          product.totalClicks > 0
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {product.totalClicks}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Nota:</strong> Os cliques são registrados quando um usuário
          clica no botão "Comprar no WhatsApp" (na modal) ou "Finalizar Pedido no WhatsApp" (no carrinho).
        </p>
      </div>
    </div>
  );
}