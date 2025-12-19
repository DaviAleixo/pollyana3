import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { Product, Category, ProductColor, SizeType, ProductVariant, DiscountType } from '../../types';
import { resizeImage, validateFileSize, validateFileType } from '../../utils/imageUtils';
import { STANDARD_COLORS, getNearestColorName } from '../../utils/colorUtils';
import ColorPicker from '../../components/ColorPicker';
import { calculateDiscountedPrice } from '../../utils/productUtils';
import { NumericFormat } from 'react-number-format'; // Importar NumericFormat

// Função auxiliar para formatar a data ISO para o input datetime-local
const formatIsoToLocal = (isoString: string | undefined): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Ajusta para o fuso horário local para que o input exiba a hora correta
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

// Função auxiliar para converter a string local do input de volta para ISO (sem offset)
const formatLocalToIso = (localString: string): string => {
  if (!localString) return '';
  // Cria a data localmente e salva como ISO, mas sem o 'Z' (UTC), para que o banco salve o valor exato
  return new Date(localString).toISOString().slice(0, 19);
};


export default function ProductFormNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null);

  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [mainImageUploadLoading, setMainImageUploadLoading] = useState(false);

  const [tipoTamanho, setTipoTamanho] = useState<SizeType>('padrao');
  const [standardColorsWithImages, setStandardColorsWithImages] = useState<ProductColor[]>([]);
  const [customColorsEnabled, setCustomColorsEnabled] = useState(false);
  const [customColors, setCustomColors] = useState<ProductColor[]>([]);
  const [newCustomColor, setNewCustomColor] = useState({ nome: '', hex: '#000000' });
  const [newCustomColorImagePreview, setNewCustomColorImagePreview] = useState<string>('');
  const [newCustomColorUploadLoading, setNewCustomColorUploadLoading] = useState(false);
  const [lastAddedCustomColorId, setLastAddedCustomColorId] = useState<string | null>(null);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [imagesRequiredForColors, setImagesRequiredForColors] = useState(false);

  const [discountActive, setDiscountActive] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountExpiresAt, setDiscountExpiresAt] = useState<string>('');

  // ESTADOS PARA LANÇAMENTO
  const [isLaunch, setIsLaunch] = useState(false);
  const [launchExpiresAt, setLaunchExpiresAt] = useState<string>('');
  // launchOrder removido

  const [formData, setFormData] = useState({
    nome: '',
    preco: 0,
    descricao: '',
    imagem: '',
    categoriaId: 0, // 0 significa "nenhuma subcategoria selecionada" ou "categoria principal tem subcategorias"
    ativo: true,
    visivel: true,
    // estoque: 0, // REMOVIDO
  });

  const tamanhosPadrao = ['P', 'M', 'G', 'GG', 'TAM ÚNICO'];
  const tamanhosNumeracao = ['34', '36', '38', '40', '42', '44', '46', '48'];

useEffect(() => {
  const loadData = async () => {
    try {
      // ✅ CORRETO: await nas chamadas assíncronas
      const fetchedAllCategories = await categoriesService.getAll();
      
      // ✅ Validação de array
      const validCategories = Array.isArray(fetchedAllCategories) ? fetchedAllCategories : [];
      
      setAllCategories(validCategories);
      setMainCategories(validCategories.filter(c => c.parentId === null));

      if (isEditing && id) {
        const product = await productsService.getById(parseInt(id));
        
        if (product) {
          setFormData({
            nome: product.nome,
            preco: product.preco,
            descricao: product.descricao,
            imagem: product.imagem,
            categoriaId: product.categoriaId,
            ativo: product.ativo,
            visivel: product.visivel,
            // estoque: product.estoque, // REMOVIDO
          });
          setMainImagePreview(product.imagem);

          if (product.tipoTamanho) setTipoTamanho(product.tipoTamanho);
          if (product.cores) {
            setStandardColorsWithImages(product.cores.filter(c => !c.isCustom));
            setCustomColors(product.cores.filter(c => c.isCustom));
            if (product.cores.some(c => c.isCustom)) setCustomColorsEnabled(true);
          }
          if (product.variants) setVariants(product.variants);
          setImagesRequiredForColors(product.imagesRequiredForColors || false);

          setDiscountActive(product.discountActive || false);
          setDiscountType(product.discountType || 'percentage');
          setDiscountValue(product.discountValue || 0);
          setDiscountExpiresAt(product.discountExpiresAt || '');

          setIsLaunch(product.isLaunch || false);
          setLaunchExpiresAt(product.launchExpiresAt || '');

          const productCategory = validCategories.find(c => c.id === product.categoriaId);
          if (productCategory) {
            if (productCategory.parentId !== null) {
              setSelectedMainCategoryId(productCategory.parentId);
            } else {
              setSelectedMainCategoryId(productCategory.id);
            }
          }
        } else {
          navigate('/admin/produtos');
        }
      } else {
        // Para novos produtos, define a categoria padrão como 'Todos' (ID 1)
        setFormData(prev => ({ ...prev, categoriaId: 1 }));
        setSelectedMainCategoryId(1);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAllCategories([]);
      setMainCategories([]);
      navigate('/admin/produtos');
    }
  };

  loadData();
}, [id, isEditing, navigate]);
  // Efeito para atualizar as subcategorias quando a categoria principal selecionada muda
  useEffect(() => {
    if (selectedMainCategoryId !== null) {
      setSubCategories(allCategories.filter(c => c.parentId === selectedMainCategoryId));
    } else {
      setSubCategories([]);
    }
  }, [selectedMainCategoryId, allCategories]);

  // Efeitos para cores personalizadas e feedback visual
  useEffect(() => {
    if (newCustomColor.hex) {
      setNewCustomColor(prev => ({ ...prev, nome: getNearestColorName(newCustomColor.hex) }));
    }
  }, [newCustomColor.hex]);

  useEffect(() => {
    if (lastAddedCustomColorId) {
      const timer = setTimeout(() => {
        setLastAddedCustomColorId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedCustomColorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const mainCatId = value === '' ? null : parseInt(value, 10);
    setSelectedMainCategoryId(mainCatId);

    if (mainCatId === null) {
      setFormData(prev => ({ ...prev, categoriaId: 1 })); // Padrão para 'Todos' se nenhuma categoria principal for selecionada
      return;
    }

    const hasSubcategories = allCategories.filter(c => c.parentId === mainCatId).length > 0;

    if (hasSubcategories) {
      setFormData(prev => ({ ...prev, categoriaId: 0 })); // Força a seleção de uma subcategoria
    } else {
      setFormData(prev => ({ ...prev, categoriaId: mainCatId })); // A categoria principal é a seleção final
    }
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, categoriaId: parseInt(e.target.value, 10) }));
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert('Tipo de arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file)) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setMainImageUploadLoading(true);

    try {
      const resizedImage = await resizeImage(file);
      setFormData((prev) => ({ ...prev, imagem: resizedImage }));
      setMainImagePreview(resizedImage);
    } catch (error) {
      console.error('Erro ao processar imagem principal:', error);
      alert('Erro ao processar imagem principal');
    } finally {
      setMainImageUploadLoading(false);
    }
  };

  const handleRemoveMainImage = () => {
    setFormData((prev) => ({ ...prev, imagem: '' }));
    setMainImagePreview('');
  };

  const toggleStandardColor = (colorName: string) => {
    setStandardColorsWithImages(prev => {
      if (prev.some(c => c.nome === colorName)) {
        return prev.filter(c => c.nome !== colorName);
      } else {
        const standardColor = STANDARD_COLORS.find(c => c.nome === colorName);
        return [...prev, { nome: colorName, imagem: '', isCustom: false, hex: standardColor?.hex || '#CCCCCC' }];
      }
    });
  };

  const handleStandardColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colorName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert('Tipo de arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file)) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      setStandardColorsWithImages(prev =>
        prev.map(c => (c.nome === colorName ? { ...c, imagem: resizedImage } : c))
      );
    } catch (error) {
      console.error(`Erro ao processar imagem para a cor ${colorName}:`, error);
      alert(`Erro ao processar imagem para a cor ${colorName}`);
    }
  };

  const handleRemoveStandardColorImage = (colorName: string) => {
    setStandardColorsWithImages(prev =>
      prev.map(c => (c.nome === colorName ? { ...c, imagem: '' } : c))
    );
  };

  const handleNewCustomColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert('Tipo de arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (!validateFileSize(file)) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setNewCustomColorUploadLoading(true);
    try {
      const resizedImage = await resizeImage(file);
      setNewCustomColorImagePreview(resizedImage);
    } catch (error) {
      console.error('Erro ao processar imagem da nova cor personalizada:', error);
      alert('Erro ao processar imagem da nova cor personalizada');
    } finally {
      setNewCustomColorUploadLoading(false);
    }
  };

  const handleRemoveNewCustomColorImage = () => {
    setNewCustomColorImagePreview('');
  };

  const handleAddCustomColor = () => {
    if (!newCustomColor.nome.trim()) {
      alert('Nome da cor é obrigatório');
      return;
    }
    if (!newCustomColor.hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newCustomColor.hex)) {
      alert('Código hexadecimal da cor é obrigatório e deve ser válido.');
      return;
    }
    if (imagesRequiredForColors && !newCustomColorImagePreview) {
      alert('É obrigatório fazer upload de uma imagem para a cor personalizada quando "Fotos obrigatórias para cor" está ativado.');
      return;
    }

    const customColor: ProductColor = {
      id: `custom-${Date.now()}-${Math.random()}`,
      nome: newCustomColor.nome,
      imagem: newCustomColorImagePreview,
      isCustom: true,
      hex: newCustomColor.hex,
    };

    setCustomColors(prev => [...prev, customColor]);
    setLastAddedCustomColorId(customColor.id);
    setNewCustomColor({ nome: '', hex: '#000000' });
    setNewCustomColorImagePreview('');
  };

  const handleRemoveCustomColor = (idToRemove: string | undefined) => {
    setCustomColors(customColors.filter(c => c.id !== idToRemove));
  };

  const generateVariants = () => {
    const newVariants: ProductVariant[] = [];
    const tamanhos = tipoTamanho === 'padrao' ? tamanhosPadrao : tamanhosNumeracao;
    const allColors = [...standardColorsWithImages.map(c => c.nome), ...customColors.map(c => c.nome)];

    if (allColors.length === 0) {
      alert('Selecione ou adicione pelo menos uma cor antes de gerar variações.');
      return;
    }

    allColors.forEach(cor => {
      tamanhos.forEach(tamanho => {
        const existingVariant = variants.find(v => v.cor === cor && v.tamanho === tamanho);

        if (existingVariant) {
          newVariants.push(existingVariant);
        } else {
          newVariants.push({
            id: `${Date.now()}-${Math.random()}`,
            cor,
            tamanho,
            estoque: 0,
          });
        }
      });
    });

    setVariants(newVariants);
  };

  const updateVariantStock = (variantId: string, estoque: number) => {
    setVariants(variants.map(v =>
      v.id === variantId ? { ...v, estoque: Math.max(0, estoque) } : v
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if (formData.preco <= 0) {
      alert('Preço deve ser maior que zero');
      return;
    }

    if (formData.categoriaId === 0) { // 0 indica que nenhuma subcategoria foi selecionada ou que a principal não pode ser usada
      alert('Selecione uma categoria ou subcategoria válida para o produto.');
      return;
    }

    const allSelectedColors = [...standardColorsWithImages, ...customColors];
    if (allSelectedColors.length === 0) {
      alert('Selecione pelo menos uma cor para o produto.');
      return;
    }
    
    if (imagesRequiredForColors) {
      const colorsWithoutImages = allSelectedColors.filter(c => !c.imagem);
      if (colorsWithoutImages.length > 0) {
        alert(`Quando "Fotos obrigatórias para cor" está ativado, todas as cores selecionadas precisam de uma imagem. As seguintes cores estão sem imagem: ${colorsWithoutImages.map(c => c.nome).join(', ')}`);
        return;
      }
    }

    if (variants.length === 0) {
      alert('Clique em "Gerar Variações" para criar as combinações de cor e tamanho e configurar o estoque.');
      return;
    }

    // Validação do desconto
    if (discountActive) {
      if (discountValue <= 0) {
        alert('O valor do desconto deve ser maior que zero.');
        return;
      }
      if (discountType === 'percentage' && discountValue > 100) {
        alert('A porcentagem de desconto não pode ser maior que 100%.');
        return;
      }
      if (!discountExpiresAt) {
        alert('A data de expiração do desconto é obrigatória quando o desconto está ativo.');
        return;
      }
      if (new Date(discountExpiresAt) < new Date()) {
        alert('A data de expiração do desconto deve ser no futuro.');
        return;
      }

      // Simular o produto para validar o preço final
      const tempProduct: Product = {
        ...formData,
        id: 0, // ID temporário
        estoque: 0, // Adicionado estoque para satisfazer o tipo Product
        discountActive,
        discountType,
        discountValue,
        discountExpiresAt,
      };
      const finalPrice = calculateDiscountedPrice(tempProduct);
      if (finalPrice < 0) {
        alert('O desconto não pode resultar em um preço final negativo.');
        return;
      }
    }

    // Validação do lançamento
    if (isLaunch && launchExpiresAt && new Date(launchExpiresAt) < new Date()) {
      alert('A data de expiração do lançamento deve ser no futuro.');
      return;
    }


    const estoqueTotal = variants.reduce((sum, v) => sum + v.estoque, 0);

    const productData: Product = {
      ...formData,
      estoque: estoqueTotal, // O estoque total é calculado a partir das variantes
      tipoTamanho,
      cores: allSelectedColors,
      variants,
      imagesRequiredForColors,
      // Dados de desconto
      discountActive: discountActive,
      discountType: discountActive ? discountType : undefined,
      discountValue: discountActive ? discountValue : undefined,
      discountExpiresAt: discountActive ? discountExpiresAt : undefined,
      // Dados de lançamento
      isLaunch: isLaunch,
      launchExpiresAt: isLaunch && launchExpiresAt ? launchExpiresAt : undefined,
      // launchOrder removido
    };

    console.log('ProductFormNew.handleSubmit() - Product data being saved:', {
      id: isEditing ? parseInt(id!) : 'new',
      nome: productData.nome,
      categoriaId: productData.categoriaId,
      estoque: productData.estoque,
      isLaunch: productData.isLaunch,
      launchExpiresAt: productData.launchExpiresAt,
      // launchOrder removido
      // ... other relevant fields
    });

    if (isEditing && id) {
      productsService.update(parseInt(id), productData);
    } else {
      productsService.create(productData);
    }

    navigate('/admin/produtos');
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/produtos')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </button>
        <h1 className="text-3xl font-bold text-black mb-2">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preço *
            </label>
            <NumericFormat
              value={formData.preco}
              onValueChange={(values) => setFormData(prev => ({ ...prev, preco: values.floatValue || 0 }))}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            />
          </div>

          {/* Seleção de Categoria Principal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoria Principal *
            </label>
            <select
              value={selectedMainCategoryId === null ? '' : selectedMainCategoryId}
              onChange={handleMainCategoryChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            >
              <option value="">Selecione uma categoria principal</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Subcategoria (dinâmica) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subcategoria (opcional)
            </label>
            <select
              name="categoriaId"
              value={formData.categoriaId === 0 ? '' : formData.categoriaId} // Se 0, mostra opção vazia
              onChange={handleSubCategoryChange}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              disabled={!selectedMainCategoryId || subCategories.length === 0}
            >
              <option value="">
                {subCategories.length === 0 ? 'Nenhuma subcategoria' : 'Selecione uma subcategoria'}
              </option>
              {subCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            {selectedMainCategoryId && subCategories.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Esta categoria principal não possui subcategorias.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Tamanho *
            </label>
            <select
              value={tipoTamanho}
              onChange={(e) => setTipoTamanho(e.target.value as SizeType)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
            >
              <option value="padrao">Tamanhos de roupa (P/M/G/GG/TAM ÚNICO)</option>
              <option value="numeracao">Tamanhos numéricos (34 a 48)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagem Principal do Produto (Usada como padrão se nenhuma cor for selecionada ou para cores sem imagem específica)
            </label>

            {mainImagePreview && (
              <div className="mb-4 relative inline-block">
                <img
                  src={mainImagePreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveMainImage}
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
                {mainImageUploadLoading ? 'Processando...' : 'Fazer Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleMainImageUpload}
                  className="hidden"
                  disabled={mainImageUploadLoading}
                />
              </label>
              <div className="bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  📐 Resolução Recomendada: 1000x1000px (formato quadrado)
                </p>
                <p className="text-xs text-blue-700">
                  JPG, PNG ou WEBP • Máx 5MB • Ajuste automático
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={imagesRequiredForColors}
                onChange={(e) => setImagesRequiredForColors(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Fotos obrigatórias para cor</span>
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Se ativado, cada cor selecionada (padrão ou personalizada) exigirá uma imagem específica.
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Cores Disponíveis *
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Selecione as cores padrão que este produto possui e faça upload de uma imagem para cada uma.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {STANDARD_COLORS.map((color) => {
                const isSelected = standardColorsWithImages.some(c => c.nome === color.nome);
                const currentColorConfig = standardColorsWithImages.find(c => c.nome === color.nome);

                return (
                  <div key={color.nome} className="border-2 border-gray-300 p-3">
                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStandardColor(color.nome)}
                        className="w-4 h-4"
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <span className="text-sm font-medium">{color.nome}</span>
                    </label>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Imagem para {color.nome} {imagesRequiredForColors && '*'}
                        </label>
                        {currentColorConfig?.imagem && (
                          <div className="mb-2 relative inline-block">
                            <img
                              src={currentColorConfig.imagem}
                              alt={`Preview ${color.nome}`}
                              className="w-20 h-20 object-cover border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveStandardColorImage(color.nome)}
                              className="absolute -top-1 -right-1 bg-red-600 text-white p-1 hover:bg-red-700 transition-colors"
                              title="Remover imagem"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 px-3 py-2 cursor-pointer hover:border-black transition-colors text-xs">
                          <Upload className="w-3 h-3" />
                          Upload Imagem
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleStandardColorImageUpload(e, color.nome)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={customColorsEnabled}
                onChange={(e) => setCustomColorsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Adicionar outras cores (personalizadas)</span>
            </label>

            {customColorsEnabled && (
              <div className="border border-gray-300 p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Cores Personalizadas</h3>

                {customColors.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customColors.map((cor) => (
                      <div 
                        key={cor.id} 
                        className={`flex items-center gap-3 border border-gray-300 p-3 bg-white transition-colors duration-500 ${
                          cor.id === lastAddedCustomColorId ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <div
                          className="w-16 h-16 flex-shrink-0 border border-gray-200 overflow-hidden"
                          style={{ backgroundColor: cor.hex || '#CCCCCC' }}
                        >
                          {cor.imagem && (
                            <img src={cor.imagem} alt={cor.nome} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cor.nome}</p>
                          {cor.hex && <p className="text-xs text-gray-500">{cor.hex}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomColor(cor.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Cor *
                    </label>
                    <input
                      type="text"
                      value={newCustomColor.nome}
                      onChange={(e) => setNewCustomColor(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Laranja, Roxo..."
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                      required={customColorsEnabled}
                    />
                  </div>

                  <ColorPicker
                    label="Cor Hexadecimal *"
                    value={newCustomColor.hex || '#000000'}
                    onChange={(hex) => setNewCustomColor(prev => ({ ...prev, hex }))}
                    className="mb-3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Imagem para a Nova Cor Personalizada {imagesRequiredForColors && '*'}
                  </label>
                  {newCustomColorImagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={newCustomColorImagePreview}
                        alt="Preview Nova Cor"
                        className="w-24 h-24 object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveNewCustomColorImage}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 hover:bg-red-700 transition-colors"
                        title="Remover imagem"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 px-3 py-2 cursor-pointer hover:border-black transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    {newCustomColorUploadLoading ? 'Processando...' : 'Upload Imagem'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleNewCustomColorImageUpload}
                      className="hidden"
                      disabled={newCustomColorUploadLoading}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Cor Personalizada
                </button>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={generateVariants}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors font-medium"
            >
              Gerar Variações (Cor × Tamanho)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Clique para criar todas as combinações de cor e tamanho. Configure o estoque de cada variação abaixo.
            </p>
          </div>

          {variants.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Variações e Estoque ({variants.length})
              </h3>
              <div className="border border-gray-300 max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-semibold">Cor</th>
                      <th className="text-left px-4 py-2 text-sm font-semibold">Tamanho</th>
                      <th className="text-center px-4 py-2 text-sm font-semibold">Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{variant.cor}</td>
                        <td className="px-4 py-2 text-sm">{variant.tamanho}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            value={variant.estoque}
                            onChange={(e) => updateVariantStock(variant.id, parseInt(e.target.value) || 0)}
                            className="w-24 border border-gray-300 px-2 py-1 text-center focus:outline-none focus:border-black"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Estoque Total: <strong>{variants.reduce((sum, v) => sum + v.estoque, 0)}</strong> unidades
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black resize-none"
              placeholder="Descreva o produto..."
            ></textarea>
          </div>

          {/* Seção de Lançamento */}
          <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-bold text-black mb-4">Configuração de Lançamento</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLaunch}
                  onChange={(e) => setIsLaunch(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Marcar como lançamento</span>
              </label>

              {isLaunch && (
                <>
                  {/* Ordem de Prioridade REMOVIDA */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Data de Expiração (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formatIsoToLocal(launchExpiresAt)}
                      onChange={(e) => setLaunchExpiresAt(formatLocalToIso(e.target.value))}
                      className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      O produto sairá da seção de lançamentos automaticamente após esta data.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Seção de Desconto do Produto */}
          <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-bold text-black mb-4">Desconto do Produto</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discountActive}
                  onChange={(e) => setDiscountActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Ativar desconto</span>
              </label>

              {discountActive && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo do desconto *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={discountType === 'percentage'}
                          onChange={() => setDiscountType('percentage')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Porcentagem (%)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          value="fixed"
                          checked={discountType === 'fixed'}
                          onChange={() => setDiscountType('fixed')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Valor direto (R$)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor do desconto *
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                      placeholder={discountType === 'percentage' ? 'Ex: 10 para 10%' : 'Ex: 20.00 para R$20 de desconto'}
                      required
                    />
                    {formData.preco > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Preço final estimado: R$ {calculateDiscountedPrice({ ...formData, id: 0, estoque: 0, discountActive: true, discountType, discountValue, discountExpiresAt: '2100-01-01T00:00:00Z' }).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Data de expiração *
                    </label>
                    <input
                      type="datetime-local"
                      value={formatIsoToLocal(discountExpiresAt)}
                      onChange={(e) => setDiscountExpiresAt(formatLocalToIso(e.target.value))}
                      className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Produto Ativo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="visivel"
                checked={formData.visivel}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Visível no Catálogo</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors font-medium"
          >
            {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/produtos')}
            className="border-2 border-gray-300 text-gray-700 px-6 py-2 hover:border-black hover:text-black transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}