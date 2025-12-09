import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, EyeOff, Power, Package } from 'lucide-react';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { stockService } from '../../services/stock.service';
import { Product, Category } from '../../types';

// Página de listagem de produtos
// Exibe tabela com todos os produtos e ações de CRUD

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Carregar produtos e categorias
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(productsService.getAll());
    setCategories(categoriesService.getAll());
  };

  // Obter nome da categoria por ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.nome || 'Sem categoria';
  };

  // Excluir produto
  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      productsService.delete(id);
      loadData();
    }
  };

  // Alternar status ativo
  const handleToggleActive = (id: number) => {
    productsService.toggleActive(id);
    loadData();
  };

  // Alternar visibilidade
  const handleToggleVisible = (id: number) => {
    productsService.toggleVisible(id);
    loadData();
  };

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
                  Estoque
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {/* Imagem */}
                    <td className="px-6 py-4">
                      <img
                        src={product.imagem}
                        alt={product.nome}
                        className="w-16 h-16 object-cover"
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

                    {/* Estoque */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/admin/produtos/estoque/${product.id}`}
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