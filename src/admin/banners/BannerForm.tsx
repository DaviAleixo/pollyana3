import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { bannersService } from '../../services/banners.service';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { Banner, BannerLinkType, Product, Category } from '../../types';
import { resizeImage, validateFileSize, validateFileType } from '../../utils/imageUtils';
import SearchSelectInput from '../../components/SearchSelectInput';
import { showError, showSuccess } from '../../utils/toast'; // Import toast utilities

// ID fixo para a categoria virtual de Promoção
const PROMOTION_CATEGORY_ID = 99999;

export default function BannerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    imageUrl: '',
    textOverlay: '',
    isVisible: true,
    order: 0,
    linkType: 'informational',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Carregar produtos e categorias de forma assíncrona
      const [productsResult, categoriesResult, bannerData] = await Promise.all([
        productsService.getAll(),
        categoriesService.getAll(),
        isEditing && id ? bannersService.getById(parseInt(id)) : Promise.resolve(null),
      ]);

      setProducts(Array.isArray(productsResult) ? productsResult : []);
      
      const fetchedCategories = Array.isArray(categoriesResult) ? categoriesResult : [];
      setCategories(fetchedCategories);

      if (isEditing && bannerData) {
        setFormData(bannerData);
        setImagePreview(bannerData.imageUrl);
      } else {
        // Para novo banner, define a ordem
        const allBanners = await bannersService.getAll(false);
        setFormData(prev => ({
          ...prev,
          order: allBanners.length + 1,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do formulário de banner:', error);
      showError('Erro ao carregar dados do banner.');
      navigate('/admin/banners');
    } finally {
      setLoadingData(false);
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      showError('Tipo de arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file, 10)) {
      showError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setImageUploadLoading(true);
    try {
      const resizedImage = await resizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
      });
      setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
      setImagePreview(resizedImage);
      showSuccess('Imagem do banner carregada.');
    } catch (error) {
      console.error('Erro ao processar imagem do banner:', error);
      showError('Erro ao processar imagem do banner');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview('');
  };

  const handleLinkTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLinkType = e.target.value as BannerLinkType;
    setFormData(prev => ({
      ...prev,
      linkType: newLinkType,
      linkedProductId: undefined,
      linkedCategoryId: undefined,
      externalUrl: undefined,
    }));
  };

  const handleSelectProduct = (productId: number | null) => {
    setFormData(prev => ({ ...prev, linkedProductId: productId || undefined }));
  };

  const handleSelectCategory = (categoryId: number | null) => {
    setFormData(prev => ({ ...prev, linkedCategoryId: categoryId || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      showError('A imagem do banner é obrigatória.');
      return;
    }

    if (formData.linkType === 'product' && !formData.linkedProductId) {
      showError('Selecione um produto para o banner.');
      return;
    }

    if (formData.linkType === 'category' && !formData.linkedCategoryId) {
      showError('Selecione uma categoria para o banner.');
      return;
    }

    if (
      formData.linkType === 'external' &&
      (!formData.externalUrl || !/^https?:\/\/.+/.test(formData.externalUrl))
    ) {
      showError('Insira uma URL externa válida (começando com http:// ou https://).');
      return;
    }

    let success = false;
    if (isEditing && id) {
      const result = await bannersService.update(parseInt(id), formData);
      if (result) {
        showSuccess('Banner atualizado com sucesso!');
        success = true;
      } else {
        showError('Erro ao atualizar banner.');
      }
    } else {
      const result = await bannersService.create(formData);
      if (result) {
        showSuccess('Banner criado com sucesso!');
        success = true;
      } else {
        showError('Erro ao criar banner.');
      }
    }

    if (success) {
      navigate('/admin/banners');
    }
  };

  // Mapeamento de produtos para o formato SearchSelectInput
  const productItems = products.map(p => ({
    id: p.id,
    name: p.nome,
    description: `R$ ${p.preco.toFixed(2)} | Estoque: ${p.estoque}`,
  }));

  // Mapeamento de categorias para o formato SearchSelectInput
  const categoryItems = categories
    .filter(c => c.id !== 1) // Exclui a categoria 'Todos'
    .map(c => ({
      id: c.id,
      name: c.nome,
      description: c.parentId ? `Subcategoria de ${categories.find(p => p.id === c.parentId)?.nome || 'Pai Desconhecido'}` : 'Categoria Principal',
    }));
    
  // Adicionar a categoria virtual 'Promoção'
  const promotionCategoryItem = {
    id: PROMOTION_CATEGORY_ID,
    name: 'Promoção',
    description: 'Produtos com desconto ativo',
  };
  
  const finalCategoryItems = [promotionCategoryItem, ...categoryItems];


  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/banners')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para banners
        </button>
        <h1 className="text-3xl font-bold text-black mb-2">
          {isEditing ? 'Editar Banner' : 'Novo Banner'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Atualize as informações do banner' : 'Crie um novo banner para o catálogo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagem do Banner *
            </label>

            {imagePreview && (
              <div className="mb-4 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview Banner"
                  className="w-full max-w-md h-auto object-cover border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white p-1 hover:bg-red-700 transition-colors"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 bg-black text-white px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors w-fit">
                <Upload className="w-4 h-4" />
                {imageUploadLoading ? 'Processando...' : 'Fazer Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUploadLoading}
                />
              </label>
              <div className="bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  📐 Resolução Recomendada: Imagens responsivas (ex: 1920px de largura para desktop, 720px para mobile). Proporção 16:9 é comum.
                </p>
                <p className="text-xs text-blue-700">
                  JPG, PNG ou WEBP • Máx 10MB • Ajuste automático
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Texto de Sobreposição (opcional)
            </label>
            <input
              type="text"
              name="textOverlay"
              value={formData.textOverlay || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="Ex: Nova Coleção, 20% OFF"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Link *
            </label>
            <select
              name="linkType"
              value={formData.linkType}
              onChange={handleLinkTypeChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            >
              <option value="informational">Banner Informativo (sem link)</option>
              <option value="product">Produto</option>
              <option value="category">Categoria</option>
              <option value="external">Link Externo</option>
            </select>
          </div>

          {formData.linkType === 'product' && (
            <SearchSelectInput
              label="Selecionar Produto *"
              items={productItems}
              initialSelectedId={formData.linkedProductId}
              onSelect={handleSelectProduct}
              placeholder="Buscar produto por nome..."
            />
          )}

          {formData.linkType === 'category' && (
            <SearchSelectInput
              label="Selecionar Categoria *"
              items={finalCategoryItems} // Usar a lista que inclui 'Promoção'
              initialSelectedId={formData.linkedCategoryId}
              onSelect={handleSelectCategory}
              placeholder="Buscar categoria por nome..."
            />
          )}

          {formData.linkType === 'external' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL Externa *
              </label>
              <input
                type="url"
                name="externalUrl"
                value={formData.externalUrl || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                placeholder="https://www.seusite.com"
                required
              />
            </div>
          )}

          <div className="md:col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Visível no Carrossel</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors font-medium"
          >
            {isEditing ? 'Atualizar Banner' : 'Criar Banner'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/banners')}
            className="border-2 border-gray-300 text-gray-700 px-6 py-2 hover:border-black hover:text-black transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}