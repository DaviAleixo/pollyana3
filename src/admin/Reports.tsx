import { useEffect, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { productsService } from '../services/products.service';
import { clicksService } from '../services/clicks.service';
import { ProductWithStats } from '../types';

// Página de relatórios simplificada
// Mostra apenas Produto e Cliques, ordenado por maior número de cliques

type SortOrder = 'desc' | 'asc';

export default function Reports() {
  const [productsWithStats, setProductsWithStats] = useState<ProductWithStats[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadData();
  }, [sortOrder]);

  const loadData = () => {
    const products = productsService.getAll();
    const clicks = clicksService.getAll();

    // Combinar produtos com estatísticas de cliques
    const withStats: ProductWithStats[] = products.map((product) => {
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
  };

  // Alternar ordenação
  const toggleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Relatórios de Cliques
        </h1>
        <p className="text-gray-600">
          Produtos mais clicados no catálogo
        </p>
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

      {/* Tabela simplificada */}
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
                    {/* Posição */}
                    <td className="px-4 sm:px-6 py-4 text-gray-500 font-medium text-sm sm:text-base">
                      {index + 1}º
                    </td>

                    {/* Nome do produto */}
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {product.nome}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        R$ {product.preco.toFixed(2)}
                      </p>
                    </td>

                    {/* Total de cliques */}
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

      {/* Nota informativa */}
      <div className="mt-6 bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Nota:</strong> Os cliques são registrados quando um usuário
          clica no botão "Comprar no WhatsApp" de cada produto no catálogo
          público.
        </p>
      </div>
    </div>
  );
}
