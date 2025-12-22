import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { categoriesService } from '../../services/categories.service';
import { Category } from '../../types';
import { showError, showSuccess } from '../../utils/toast';

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    visivel: true,
    parentId: null as number | null,
    slug: '', // Será gerado automaticamente
  });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  // Removido: const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

 useEffect(() => {
  async function loadData() {
    const fetchedCategories = await categoriesService.getAll();
    setAllCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);

    if (isEditing && id) {
      const category = await categoriesService.getById(parseInt(id));
      if (category) {
        if (category.id === 1) {
          showError('A categoria "Todos" não pode ser editada.');
          navigate('/admin/categorias');
          return;
        }

        setFormData({
          nome: category.nome,
          visivel: category.visivel,
          parentId: category.parentId || null,
          slug: category.slug,
        });
      } else {
        showError('Categoria não encontrada');
        navigate('/admin/categorias');
      }
    } else {
      const parentIdFromUrl = searchParams.get('parentId');
      if (parentIdFromUrl) {
        setFormData(prev => ({
          ...prev,
          parentId: parseInt(parentIdFromUrl, 10)
        }));
      }
    }
  }

  loadData();
}, [id, isEditing, navigate, searchParams]);

  // Gerar slug automaticamente ao mudar o nome
  useEffect(() => {
    if (formData.nome) {
      const generatedSlug = formData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    } else {
      setFormData(prev => ({ ...prev, slug: '' }));
    }
  }, [formData.nome]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;

    if (name === 'parentId') {
      setFormData((prev) => ({ ...prev, parentId: value === '' ? null : parseInt(value, 10) }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      showError('Nome é obrigatório.');
      return;
    }

    // Validação de categoria pai: não pode ser ela mesma
    if (isEditing && formData.parentId === parseInt(id!)) {
      showError('Uma categoria não pode ser sua própria pai.');
      return;
    }

    const dataToSave = {
      nome: formData.nome,
      visivel: formData.visivel,
      parentId: formData.parentId,
    };

    let success = false;

    if (isEditing && id) {
      const result = await categoriesService.update(parseInt(id), dataToSave);
      if (result) {
        showSuccess('Categoria atualizada com sucesso!');
        success = true;
      } else {
        showError('Erro ao atualizar categoria.');
      }
    } else {
      const result = await categoriesService.create(dataToSave);
      if (result) {
        showSuccess('Categoria criada com sucesso!');
        success = true;
      } else {
        showError('Erro ao criar categoria.');
      }
    }

    if (success) {
      navigate('/admin/categorias');
    }
  };

  // Filtrar categorias para o dropdown de pai (excluir a própria categoria e seus descendentes)
  const availableParents = allCategories.filter(cat => {
    if (cat.id === 1) return false; // Não pode ser filho de "Todos"
    if (!isEditing) return true; // Para criação, todas são válidas
    if (cat.id === parseInt(id!)) return false; // Não pode ser pai de si mesma
    return true;
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/categorias')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para categorias
        </button>
        <h1 className="text-3xl font-bold text-black mb-2">
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </h1>
        <p className="text-gray-600">
          {isEditing
            ? 'Atualize as informações da categoria'
            : 'Preencha os dados da nova categoria'}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="Ex: Blusas, Vestidos, Calças..."
              required
            />
          </div>

          {/* Slug (automático) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug (URL amigável)
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              className="w-full border border-gray-300 px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              readOnly
              placeholder="slug-da-categoria"
            />
            <p className="text-xs text-gray-500 mt-1">Gerado automaticamente a partir do nome.</p>
          </div>

          {/* Categoria Pai */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoria Pai (opcional)
            </label>
            <select
              name="parentId"
              value={formData.parentId === null ? '' : formData.parentId}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              disabled={isEditing && parseInt(id!) === 1} // Não pode mudar o pai da categoria "Todos"
            >
              <option value="">Nenhuma (Categoria Principal)</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecione uma categoria existente para torná-la subcategoria.
            </p>
          </div>

          {/* Checkbox Visível */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="visivel"
                checked={formData.visivel}
                onChange={handleChange}
                className="w-4 h-4"
                disabled={isEditing && parseInt(id!) === 1} // Não pode desativar a categoria "Todos"
              />
              <span className="text-sm text-gray-700">
                Visível no catálogo público
              </span>
            </label>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/categorias')}
            className="border-2 border-gray-300 text-gray-700 px-6 py-3 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}