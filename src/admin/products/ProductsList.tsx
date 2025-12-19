import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, EyeOff, Power, Package, ArrowUp, ArrowDown } from 'lucide-react';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { stockService } from '../../services/stock.service';
import { Product, Category } from '../../types';

// Página de listagem de produtos
// Exibe tabela com todos os produtos e ações de CRUD

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar produtos e categorias
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productsService.getAll(),
        categoriesService.getAll()
      ]);
      
      // Garantir que os produtos estejam ordenados pela propriedade 'order'
      const sortedProducts = Array.isArray(productsData) 
        ? [...productsData].sort((a, b) => a.order - b.order) 
        : [];

      setProducts(sortedProducts);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Obter nome da categoria por ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  // Excluir produto
  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      try {
        await productsService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  // Alternar status ativo
  const handleToggleActive = async (id: number) => {
    try {
      await productsService.toggleActive(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do produto');
    }
  };

  // Alternar visibilidade
  const handleToggleVisible = async (id: number) => {
    try {
      await productsService.toggleVisible(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar visibilidade:', error);
      alert('Erro ao alterar visibilidade do produto');
    }
  };

  // Mover produto para cima/baixo
  const handleMoveProduct = async (id: number, direction: 'up' | 'down') => {
    const current = [...products];
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;

    const productA = current[index];
    const productB = current[newIndex];

    // Troca de ordem: A recebe a ordem de B, B recebe a ordem de A
    const orderA = productA.order;
    const orderB = productB.order;

    // Atualiza ambos os produtos no banco de dados
    await Promise.all([
      productsService.reorder(productA.id, orderB),
      productsService.reorder(productB.id, orderA),
    ]);

    // Recarrega os dados para refletir a nova ordem
    await loadData();
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Produtos</h1>
          <p className="text-gray-600">
            Gerencie todos os produtos do catálogo
          </p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
        >
          + Adicionar Produto
        </Link>
      </div>

      {/* Tabela de produtos */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Imagem
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Categoria
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Preço
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Estoque Total
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Ordem
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Ativo
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Visível
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!Array.isArray(products) || products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">
                        Nenhum produto cadastrado
                      </p>
                      <p className="text-sm mb-4">
                        Comece adicionando seu primeiro produto
                      </p>
                      <Link
                        to="/admin/produtos/novo"
                        className="inline-block bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
                      >
                        + Adicionar Produto
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {/* Imagem */}
                    <td className="px-6 py-4">
                      <img
                        src={product.imagem || 'https://via.placeholder.com/64'}
                        alt={product.nome}
                        className="w-16 h-16 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/64';
                        }}
                      />
                    </td>

                    {/* Nome */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {product.nome}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {product.descricao}
                      </p>
                    </td>

                    {/* Categoria */}
                    <td className="px-6 py-4 text-gray-700">
                      {getCategoryName(product.categoriaId)}
                    </td>

                    {/* Preço */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      R$ {product.preco.toFixed(2)}
                    </td>

                    {/* Estoque Total */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/admin/estoque`}
                        className={`inline-flex items-center gap-1 px-3 py-1 font-semibold text-sm transition-colors ${
                          stockService.isLowStock(product.id)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Gerenciar estoque"
                      >
                        <Package className="w-4 h-4" />
                        {product.estoque}
                      </Link>
                    </td>

                    {/* Ordem */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveProduct(product.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <span className="font-semibold">{product.order}</span>

                        <button
                          onClick={() => handleMoveProduct(product.id, 'down')}
                          disabled={index === products.length - 1}
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Status Ativo */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={`p-2 transition-colors ${
                          product.ativo
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={product.ativo ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                    </td>

                    {/* Status Visível */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleVisible(product.id)}
                        className={`p-2 transition-colors ${
                          product.visivel
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={product.visivel ? 'Ocultar' : 'Mostrar'}
                      >
                        {product.visivel ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/produtos/editar/${product.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(product.id, product.nome)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
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
    </div>
  );
}