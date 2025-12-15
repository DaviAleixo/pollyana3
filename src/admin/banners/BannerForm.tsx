import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { bannersService } from '../../services/banners.service';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { Banner, BannerLinkType, Product, Category } from '../../types';
import { resizeImage, validateFileSize, validateFileType } from '../../utils/imageUtils';

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

  const [searchTermProduct, setSearchTermProduct] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    const productsResult = productsService.getAll();
    const categoriesResult = categoriesService.getAll();

    setProducts(Array.isArray(productsResult) ? productsResult : []);
    setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);

    if (isEditing && id) {
      const banner = bannersService.getById(parseInt(id));
      if (banner) {
        setFormData(banner);
        setImagePreview(banner.imageUrl);

        if (banner.linkType === 'product' && banner.linkedProductId) {
          const product = productsService.getById(banner.linkedProductId);
          setSearchTermProduct(product?.nome || '');
        }
      } else {
        navigate('/admin/banners');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        order: bannersService.getAll(false).length + 1,
      }));
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    if (searchTermProduct.length > 0) {
      setFilteredProducts(
        Array.isArray(products)
          ? products.filter(p =>
              p.nome.toLowerCase().includes(searchTermProduct.toLowerCase())
            )
          : []
      );
    } else {
      setFilteredProducts([]);
    }
  }, [searchTermProduct, products]);

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
      alert('Tipo de arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file, 10)) {
      alert('Arquivo muito grande. Tamanho máximo: 10MB');
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
    } catch (error) {
      console.error('Erro ao processar imagem do banner:', error);
      alert('Erro ao processar imagem do banner');
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
    setSearchTermProduct('');
  };

  const handleSelectProduct = (product: Product) => {
    setFormData(prev => ({ ...prev, linkedProductId: product.id }));
    setSearchTermProduct(product.nome);
    setShowProductDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      alert('A imagem do banner é obrigatória.');
      return;
    }

    if (formData.linkType === 'product' && !formData.linkedProductId) {
      alert('Selecione um produto para o banner.');
      return;
    }

    if (formData.linkType === 'category' && !formData.linkedCategoryId) {
      alert('Selecione uma categoria para o banner.');
      return;
    }

    if (
      formData.linkType === 'external' &&
      (!formData.externalUrl || !/^https?:\/\/.+/.test(formData.externalUrl))
    ) {
      alert('Insira uma URL externa válida (começando com http:// ou https://).');
      return;
    }

    if (isEditing && id) {
      bannersService.update(parseInt(id), formData);
    } else {
      bannersService.create(formData);
    }

    navigate('/admin/banners');
  };

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
              value={formData.textOverlay}
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
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecionar Produto *
              </label>
              <input
                type="text"
                value={searchTermProduct}
                onChange={(e) => {
                  setSearchTermProduct(e.target.value);
                  setShowProductDropdown(true);
                  setFormData(prev => ({ ...prev, linkedProductId: undefined }));
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 100)}
                className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                placeholder="Buscar produto..."
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredProducts.map(product => (
                    <li
                      key={product.id}
                      onMouseDown={() => handleSelectProduct(product)}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                    >
                      {product.nome} (R$ {product.preco.toFixed(2)})
                    </li>
                  ))}
                </ul>
              )}
              {formData.linkedProductId && searchTermProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Produto selecionado: {searchTermProduct}
                </p>
              )}
            </div>
          )}

          {formData.linkType === 'category' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecionar Categoria *
              </label>
              <select
                name="linkedCategoryId"
                value={formData.linkedCategoryId || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    linkedCategoryId: parseInt(e.target.value, 10) || undefined,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>
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
