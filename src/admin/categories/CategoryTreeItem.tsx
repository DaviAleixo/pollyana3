import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Category } from '../../types';
import { categoriesService } from '../../services/categories.service';
import { productsService } from '../../services/products.service';

interface CategoryTreeItemProps {
  category: Category;
  level: number;
  allCategories: Category[];
  onCategoryChange: () => void;
  onMoveCategory: (id: number, newOrder: number, newParentId: number | null) => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  level,
  allCategories,
  onCategoryChange,
  onMoveCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const subcategories = allCategories
    .filter(cat => cat.parentId === category.id)
    .sort((a, b) => a.order - b.order);

  const getProductCount = (categoryId: number): number => {
    const descendants = categoriesService.getDescendants(categoryId);
    const descendantIds = descendants.map(d => d.id);
    return productsService.getAll().filter(p => descendantIds.includes(p.categoriaId)).length;
  };

  const handleDelete = (id: number, nome: string) => {
    if (id === 1) {
      alert('A categoria "Todos" não pode ser excluída.');
      return;
    }

    const productCount = getProductCount(id);
    const childrenCount = subcategories.length;

    let message = `Deseja realmente excluir a categoria "${nome}"?`;
    if (productCount > 0) {
      message += ` Ela possui ${productCount} produto(s) que serão movidos para "Todos".`;
    }
    if (childrenCount > 0) {
      message += ` Suas ${childrenCount} subcategoria(s) serão movidas para o nível superior.`;
    }

    if (window.confirm(message)) {
      categoriesService.delete(id);
      onCategoryChange();
    }
  };

  const handleToggleVisible = (id: number) => {
    categoriesService.update(id, { visivel: !category.visivel });
    onCategoryChange();
  };

  const handleMoveUp = () => {
    const siblings = allCategories
      .filter(c => c.parentId === category.parentId)
      .sort((a, b) => a.order - b.order);
    const currentIndex = siblings.findIndex(s => s.id === category.id);

    if (currentIndex > 0) {
      const prevSibling = siblings[currentIndex - 1];
      onMoveCategory(category.id, prevSibling.order, category.parentId);
      onMoveCategory(prevSibling.id, category.order, prevSibling.parentId);
    }
  };

  const handleMoveDown = () => {
    const siblings = allCategories
      .filter(c => c.parentId === category.parentId)
      .sort((a, b) => a.order - b.order);
    const currentIndex = siblings.findIndex(s => s.id === category.id);

    if (currentIndex < siblings.length - 1) {
      const nextSibling = siblings[currentIndex + 1];
      onMoveCategory(category.id, nextSibling.order, category.parentId);
      onMoveCategory(nextSibling.id, category.order, nextSibling.parentId);
    }
  };

  const productCount = getProductCount(category.id);
  const hasChildren = subcategories.length > 0;

  return (
    <>
      <tr className="hover:bg-gray-50">
        {/* Nome e Expansão */}
        <td className="px-6 py-4" style={{ paddingLeft: `${level * 20 + 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-gray-500 hover:text-black">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            <span className="font-medium text-gray-900">
              {category.nome}
            </span>
            {category.id === 1 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Padrão
              </span>
            )}
          </div>
        </td>

        {/* Slug */}
        <td className="px-6 py-4 text-gray-700 text-sm">
          {category.slug}
        </td>

        {/* Produtos */}
        <td className="px-6 py-4 text-center text-gray-700">
          {productCount}
        </td>

        {/* Visível */}
        <td className="px-6 py-4 text-center">
          <button
            onClick={() => handleToggleVisible(category.id)}
            className={`p-2 transition-colors ${
              category.visivel
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={category.visivel ? 'Ocultar' : 'Mostrar'}
            disabled={category.id === 1} // Não pode desativar a categoria "Todos"
          >
            {category.visivel ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </td>

        {/* Ações */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {category.id !== 1 && (
              <>
                <button
                  onClick={handleMoveUp}
                  disabled={category.order === 0} // Desabilitar se for o primeiro
                  className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleMoveDown}
                  disabled={category.order === subcategories.length - 1 && !hasChildren} // Desabilitar se for o último
                  className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <Link
                  to={`/admin/categorias/novo?parentId=${category.id}`}
                  className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                  title="Criar Subcategoria"
                >
                  <Plus className="w-5 h-5" />
                </Link>
                <Link
                  to={`/admin/categorias/editar/${category.id}`}
                  className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleDelete(category.id, category.nome)}
                  className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            {category.id === 1 && (
              <span className="text-sm text-gray-400 px-2">
                Não editável
              </span>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && hasChildren && (
        <>
          {subcategories.map((subcat) => (
            <CategoryTreeItem
              key={subcat.id}
              category={subcat}
              level={level + 1}
              allCategories={allCategories}
              onCategoryChange={onCategoryChange}
              onMoveCategory={onMoveCategory}
            />
          ))}
        </>
      )}
    </>
  );
};

export default CategoryTreeItem;