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
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    imageUrl: '',
    textOverlay: '',
    isVisible: true,
    order: 0,
    linkType: 'informational',
    linkedProductId: undefined,
    linkedCategoryId: undefined,
    externalUrl: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchTermProduct, setSearchTermProduct] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  /* =======================
     LOAD INITIAL DATA
  ======================= */
  useEffect(() => {
    const loadedProducts = productsService.getAll() ?? [];
    const loadedCategories = categoriesService.getAll() ?? [];

    setProducts(Array.isArray(loadedProducts) ? loadedProducts : []);
    setCategories(Array.isArray(loadedCategories) ? loadedCategories : []);

    if (isEditing && id) {
      const banner = bannersService.getById(Number(id));
      if (!banner) {
        navigate('/admin/banners');
        return;
      }

      setFormData({
        imageUrl: banner.imageUrl ?? '',
        textOverlay: banner.textOverlay ?? '',
        isVisible: banner.isVisible ?? true,
        order: banner.order ?? 0,
        linkType: banner.linkType ?? 'informational',
        linkedProductId: banner.linkedProductId,
        linkedCategoryId: banner.linkedCategoryId,
        externalUrl: banner.externalUrl ?? '',
      });

      setImagePreview(banner.imageUrl ?? '');

      if (banner.linkType === 'product' && banner.linkedProductId) {
        const product = loadedProducts.find(p => p.id === banner.linkedProductId);
        setSearchTermProduct(product?.nome ?? '');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        order: bannersService.getAll(false)?.length + 1 || 1,
      }));
    }
  }, [id, isEditing, navigate]);

  /* =======================
     FILTER PRODUCTS
  ======================= */
  useEffect(() => {
    if (!searchTermProduct.trim()) {
      setFilteredProducts([]);
      return;
    }

    const result = products.filter(p =>
      p.nome.toLowerCase().includes(searchTermProduct.toLowerCase())
    );

    setFilteredProducts(result);
  }, [searchTermProduct, products]);

  /* =======================
     HANDLERS
  ======================= */
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
          ? Number(value) || 0
          : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert('Tipo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file, 10)) {
      alert('Imagem muito grande. Máx 10MB.');
      return;
    }

    setImageUploadLoading(true);
    try {
      const resized = await resizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
      });

      setFormData(prev => ({ ...prev, imageUrl: resized }));
      setImagePreview(resized);
    } catch {
      alert('Erro ao processar imagem');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview('');
  };

  const handleLinkTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const linkType = e.target.value as BannerLinkType;

    setFormData(prev => ({
      ...prev,
      linkType,
      linkedProductId: undefined,
      linkedCategoryId: undefined,
      externalUrl: '',
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
      alert('Imagem obrigatória');
      return;
    }

    if (formData.linkType === 'product' && !formData.linkedProductId) {
      alert('Selecione um produto');
      return;
    }

    if (formData.linkType === 'category' && !formData.linkedCategoryId) {
      alert('Selecione uma categoria');
      return;
    }

    if (
      formData.linkType === 'external' &&
      !/^https?:\/\/.+/.test(formData.externalUrl)
    ) {
      alert('URL inválida');
      return;
    }

    if (isEditing && id) {
      bannersService.update(Number(id), formData);
    } else {
      bannersService.create(formData);
    }

    navigate('/admin/banners');
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div>
      <button
        onClick={() => navigate('/admin/banners')}
        className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Editar Banner' : 'Novo Banner'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border p-6 space-y-6">
        {/* IMAGEM */}
        <div>
          {imagePreview && (
            <div className="relative mb-3">
              <img src={imagePreview} className="max-w-md border" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <label className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 cursor-pointer">
            <Upload size={16} />
            {imageUploadLoading ? 'Processando...' : 'Upload imagem'}
            <input type="file" hidden onChange={handleImageUpload} />
          </label>
        </div>

        {/* TEXTO */}
        <input
          type="text"
          name="textOverlay"
          value={formData.textOverlay}
          onChange={handleChange}
          placeholder="Texto sobreposto"
          className="w-full border px-4 py-2"
        />

        {/* LINK TYPE */}
        <select
          value={formData.linkType}
          onChange={handleLinkTypeChange}
          className="w-full border px-4 py-2"
        >
          <option value="informational">Informativo</option>
          <option value="product">Produto</option>
          <option value="category">Categoria</option>
          <option value="external">Link externo</option>
        </select>

        {/* PRODUCT */}
        {formData.linkType === 'product' && (
          <div className="relative">
            <input
              type="text"
              value={searchTermProduct}
              onChange={e => {
                setSearchTermProduct(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
              placeholder="Buscar produto"
              className="w-full border px-4 py-2"
            />

            {showProductDropdown && filteredProducts.length > 0 && (
              <ul className="absolute w-full bg-white border shadow max-h-60 overflow-auto">
                {filteredProducts.map(p => (
                  <li
                    key={p.id}
                    onMouseDown={() => handleSelectProduct(p)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {p.nome} — R$ {p.preco.toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CATEGORY */}
        {formData.linkType === 'category' && (
          <select
            value={formData.linkedCategoryId ?? ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                linkedCategoryId: Number(e.target.value) || undefined,
              }))
            }
            className="w-full border px-4 py-2"
          >
            <option value="">Selecione</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}

        {/* EXTERNAL */}
        {formData.linkType === 'external' && (
          <input
            type="url"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border px-4 py-2"
          />
        )}

        {/* VISIBILITY */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isVisible}
            onChange={handleChange}
            name="isVisible"
          />
          Visível
        </label>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button className="bg-black text-white px-6 py-2">
            {isEditing ? 'Atualizar' : 'Criar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/banners')}
            className="border px-6 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
