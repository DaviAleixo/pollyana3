import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, AlertTriangle, Package } from 'lucide-react';
import { productsService } from '../../services/products.service';
import { stockService } from '../../services/stock.service';
import { Product, StockMovement } from '../../types';

// Página de gerenciamento de estoque de um produto específico
// Permite adicionar/remover estoque e visualizar histórico

export default function StockManagement() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = () => {
    if (!id) return;

    const productData = productsService.getById(parseInt(id));
    if (!productData) {
      alert('Produto não encontrado');
      navigate('/admin/produtos');
      return;
    }

    setProduct(productData);

    // Carregar histórico mais recente primeiro
    const historyData = stockService.getProductHistory(parseInt(id));
    setHistory(historyData.reverse());
  };

  const handleAddStock = () => {
    if (!product || quantidade <= 0) return;

    setLoading(true);
    const success = stockService.addStock(product.id, quantidade, observacao);

    if (success) {
      setQuantidade(1);
      setObservacao('');
      loadData();
    } else {
      alert('Erro ao adicionar estoque');
    }
    setLoading(false);
  };

  const handleRemoveStock = () => {
    if (!product || quantidade <= 0) return;

    if (product.estoque < quantidade) {
      alert('Estoque insuficiente');
      return;
    }

    setLoading(true);
    const success = stockService.removeStock(product.id, quantidade, observacao);

    if (success) {
      setQuantidade(1);
      setObservacao('');
      loadData();
    } else {
      alert('Erro ao remover estoque');
    }
    setLoading(false);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!product) return null;

  const isLowStock = stockService.isLowStock(product.id);

  return (
    <div className="max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/produtos')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Controle de Estoque
        </h1>
        <p className="text-gray-600">{product.nome}</p>
      </div>

      {/* Card de estoque atual */}
      <div className={`p-4 sm:p-6 mb-6 ${isLowStock ? 'bg-red-50 border-2 border-red-500' : 'bg-black text-white'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Package className={`w-8 h-8 ${isLowStock ? 'text-red-600' : 'text-white'}`} />
            <div>
              <p className={`text-sm ${isLowStock ? 'text-red-600' : 'text-white/80'}`}>
                Estoque Atual
              </p>
              <p className={`text-4xl font-bold ${isLowStock ? 'text-red-600' : 'text-white'}`}>
                {product.estoque}
              </p>
            </div>
          </div>

          {isLowStock && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm sm:text-base">Estoque Baixo!</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de movimentação */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Movimentar Estoque
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Quantidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantidade
            </label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Venda, Reposição..."
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddStock}
            disabled={loading || quantidade <= 0}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Adicionar Estoque
          </button>

          <button
            onClick={handleRemoveStock}
            disabled={loading || quantidade <= 0}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5" />
            Remover Estoque
          </button>
        </div>
      </div>

      {/* Histórico de movimentações */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">
            Histórico de Movimentações
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma movimentação registrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="text-right px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                    Quantidade
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-semibold text-gray-700">
                    Observação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(movement.data)}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold ${
                          movement.tipo === 'entrada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {movement.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right font-semibold text-gray-900">
                      {movement.tipo === 'entrada' ? '+' : '-'}
                      {movement.quantidade}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                      {movement.observacao || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
