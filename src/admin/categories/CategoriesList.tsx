import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { categoriesService } from '../../services/categories.service';
import { Category } from '../../types';
import CategoryTreeItem from './CategoryTreeItem'; // Importar o novo componente

export default function CategoriesList() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = useCallback(() => {
    const fetchedCategories = categoriesService.getAll();
    setAllCategories(fetchedCategories);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMoveCategory = (id: number, newOrder: number, newParentId: number | null) => {
    categoriesService.reorder(id, newOrder, newParentId);
    loadData(); // Recarrega os dados para refletir a nova ordem
  };

  const filteredTopLevelCategories = allCategories
    .filter(cat => cat.parentId === null)
    .filter(cat => cat.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Categorias</h1>
          <p className="text-gray-600">
            Gerencie as categorias e subcategorias de produtos
          </p>
        </div>
        <Link
          to="/admin/categorias/novo"
          className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
        >
          + Adicionar Categoria
        </Link>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Pesquisar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
        />
      </div>

      {/* Tabela de categorias */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Slug
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Produtos
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
              {filteredTopLevelCategories.length === 0 && searchTerm === '' ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              ) : filteredTopLevelCategories.length === 0 && searchTerm !== '' ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhuma categoria encontrada para "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredTopLevelCategories.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    level={0}
                    allCategories={allCategories}
                    onCategoryChange={loadData}
                    onMoveCategory={handleMoveCategory}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}