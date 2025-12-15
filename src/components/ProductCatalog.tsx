import { useEffect, useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'; // Importar ChevronLeft e ChevronRight
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { clicksService } from '../services/clicks.service';
import { bannersService } from '../services/banners.service';
import { Product, Category, Banner, SortOption } from '../types'; // Importar SortOption
import ProductModal from './ProductModal';
import { getDiscountDetails, isLaunchValid, calculateDiscountedPrice } from '../utils/productUtils'; // Importar calculateDiscountedPrice
import CountdownTimer from './CountdownTimer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Importar componentes Select
import NewArrivalsCarousel from './NewArrivalsCarousel'; // Importar o carrossel

interface ProductCatalogProps {
  allProducts: Product[]; // Receber todos os produtos do App.tsx
  categories: Category[]; // Receber categorias do App.tsx
  selectedCategory: number; // Receber selectedCategory como prop
  searchTerm: string; // Receber o termo de busca como prop
  sortOption: SortOption; // Receber a opção de ordenação
  onSortChange: (option: SortOption) => void; // Receber o handler de ordenação
}

export default function ProductCatalog({ allProducts, categories, selectedCategory, searchTerm, sortOption, onSortChange }: ProductCatalogProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleBanners, setVisibleBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Carregar banners visíveis e configurar listener para mudanças no storage
  useEffect(() => {
    const loadBanners = async () => {
      const banners = await bannersService.getAll(true);
      setVisibleBanners(banners);
      if (banners.length > 0) {
        setCurrentBannerIndex(prev => (prev < banners.length ? prev : 0));
      } else {
        setCurrentBannerIndex(0);
      }
    };

    loadBanners();

    const handleStorageChange = () => {
      loadBanners();
    };

    window.addEventListener('storage', handleStorageChange);

    // Transição automática do carrossel a cada 5 segundos
    const carouselTimer = setInterval(() => {
      setVisibleBanners(currentBanners => {
        if (currentBanners.length > 0) {
          setCurrentBannerIndex(prev => (prev + 1) % currentBanners.length);
        }
        return currentBanners;
      });
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(carouselTimer);
    };
  }, []);

  // Efeito para aplicar o filtro de categoria e busca combinados, e a ordenação
  useEffect(() => {
    const filterProducts = async () => {
      let currentFiltered = allProducts;

      // 1. Filtrar por categoria (incluindo subcategorias)
      if (selectedCategory !== 1) {
        const descendants = await categoriesService.getDescendants(selectedCategory);
        const categoryAndDescendantIds = descendants.map(c => c.id);
        currentFiltered = currentFiltered.filter((p) => categoryAndDescendantIds.includes(p.categoriaId));
      }

    // 2. Filtrar por termo de busca
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (lowerCaseSearchTerm !== '') {
      const getCategoryName = (categoryId: number): string => {
        const category = categories.find((cat) => cat.id === categoryId);
        return category?.nome || '';
      };

      currentFiltered = currentFiltered.filter((product) => {
        const productName = product.nome.toLowerCase();
        const productDescription = product.descricao?.toLowerCase() || '';
        const productCategoryName = getCategoryName(product.categoriaId).toLowerCase();

        return (
          productName.includes(lowerCaseSearchTerm) ||
          productDescription.includes(lowerCaseSearchTerm) ||
          productCategoryName.includes(lowerCaseSearchTerm)
        );
      });
    }
    
    // 3. Aplicar ordenação
    let sortedProducts = [...currentFiltered]; // Cria uma cópia mutável para ordenar

    if (sortOption === 'price_asc') {
      sortedProducts.sort((a, b) => calculateDiscountedPrice(a) - calculateDiscountedPrice(b)); // Usar preço com desconto
    } else if (sortOption === 'price_desc') {
      sortedProducts.sort((a, b) => calculateDiscountedPrice(b) - calculateDiscountedPrice(a)); // Usar preço com desconto
    } else if (sortOption === 'alpha_asc') {
      sortedProducts.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    // 'default' não aplica ordenação adicional, mantendo a ordem original após os filtros.

      // 4. Se estiver na categoria "Todos" e houver lançamentos, remover produtos de lançamento do grid
      // para evitar duplicação (eles aparecem no carrossel de lançamentos)
      if (selectedCategory === 1 && searchTerm === '') {
        sortedProducts = sortedProducts.filter(product => !isLaunchValid(product));
      }

      setFilteredProducts(sortedProducts);
    };

    filterProducts();
  }, [allProducts, categories, selectedCategory, searchTerm, sortOption]); // Adicionado sortOption

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      clicksService.registerClick(selectedProduct.id);
    }
  };

  const handleBannerClick = async (banner: Banner) => {
    switch (banner.linkType) {
      case 'product':
        if (banner.linkedProductId) {
          const product = await productsService.getById(banner.linkedProductId);
          if (product) {
            handleOpenModal(product);
          }
        }
        break;
      case 'category':
        if (banner.linkedCategoryId) {
          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'external':
        if (banner.externalUrl) {
          window.open(banner.externalUrl, '_blank');
        }
        break;
      case 'informational':
      default:
        break;
    }
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % visibleBanners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + visibleBanners.length) % visibleBanners.length);
  };

  const currentBanner = visibleBanners[currentBannerIndex];

  // Verifica se a categoria 'Todos' está selecionada para exibir o carrossel de lançamentos
  const shouldShowLaunches = selectedCategory === 1 && searchTerm === '';

  return (
    <section id="catalog" className="bg-white px-4"> {/* Removido py-16 md:py-24 */}
      <div className="max-w-7xl mx-auto">
        {/* Carrossel de Banners */}
        {visibleBanners.length > 0 && (
          <div className="relative mb-16 group overflow-hidden bg-gray-100 flex flex-col justify-end min-h-[250px] md:min-h-[400px]">
            {visibleBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                } ${banner.linkType !== 'informational' ? 'cursor-pointer' : ''}`}
                onClick={() => handleBannerClick(banner)}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.textOverlay || `Banner ${banner.id}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 p-4 flex items-center justify-center">
                  {banner.textOverlay && (
                    <p className="font-serif text-white text-3xl md:text-5xl font-bold text-center px-4 drop-shadow-lg">
                      {banner.textOverlay}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Setas de navegação do carrossel */}
            {visibleBanners.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevBanner(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 transition-all duration-300 rounded-full z-10"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextBanner(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 transition-all duration-300 rounded-full z-10"
                  aria-label="Próximo banner"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Indicadores de slide (dots) */}
            {visibleBanners.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {visibleBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex(index); }}
                    className={`h-2 transition-all duration-300 rounded-full ${
                      index === currentBannerIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Carrossel de Lançamentos (Aparece abaixo dos banners) */}
        {shouldShowLaunches && (
          <div className="mb-8">
            <NewArrivalsCarousel />
          </div>
        )}

        {/* Filtro de Ordenação (Desktop Only) */}
        <div className="hidden lg:flex justify-end mb-8 mt-8">
          <Select onValueChange={(value: SortOption) => onSortChange(value)} value={sortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="price_asc">Preço: Mais Barato</SelectItem>
              <SelectItem value="price_desc">Preço: Mais Caro</SelectItem>
              <SelectItem value="alpha_asc">Nome: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid de produtos - padronizado e responsivo */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhum produto encontrado.
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const { originalPrice, discountedPrice, isDiscountActive, savingsPercentage, countdown, discountType } = getDiscountDetails(product);
              // Verifica se é um lançamento válido (ativo e não expirado)
              const isLaunch = isLaunchValid(product);

              return (
                <div
                  key={product.id}
                  className="group bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg"
                >
                  {/* Imagem do produto - proporção fixa e padronizada */}
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={product.imagem || 'https://via.placeholder.com/600x600?text=Sem+Imagem'}
                      alt={product.nome}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Sem+Imagem';
                      }}
                    />
                    {isLaunch && (
                      <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        NOVO
                      </span>
                    )}
                    {isDiscountActive && (
                      <span className={`absolute top-3 ${isLaunch ? 'right-3' : 'left-3'} bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
                        {discountType === 'percentage' && savingsPercentage ? `${savingsPercentage}% OFF` : 'Promoção'}
                      </span>
                    )}
                  </div>

                  {/* Informações do produto - altura variável */}
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    {/* Nome do produto - altura fixa com ellipsis */}
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-black mb-2 h-12 sm:h-14 line-clamp-2">
                      {product.nome}
                    </h3>

                    {/* Descrição truncada */}
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 h-4 sm:h-5 line-clamp-1">
                      {product.descricao}
                    </p>

                    {/* Preço */}
                    <div className="mb-3 sm:mb-4">
                      {isDiscountActive ? (
                        <>
                          <p className="text-sm text-gray-500 line-through">
                            De R$ {originalPrice.toFixed(2)}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-red-600">
                            Por R$ {discountedPrice.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xl sm:text-2xl font-bold text-black">
                          R$ {originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {isDiscountActive && countdown && (
                      <CountdownTimer
                        expirationDate={product.discountExpiresAt!}
                        className="text-xs text-red-500 font-medium mb-3"
                        onExpire={() => { /* Não precisa recarregar todos os dados, apenas re-renderizar */ }}
                      />
                    )}

                    {/* Espaço flexível para empurrar botão para baixo */}
                    <div className="flex-grow"></div>

                    {/* Botão Ver Item */}
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="flex items-center justify-center gap-2 bg-black text-white py-2.5 sm:py-3 px-3 sm:px-4 w-full hover:bg-gray-800 transition-colors duration-300 font-medium mt-auto text-sm sm:text-base rounded-md"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                      <span className="whitespace-nowrap">Ver Item</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Seleção */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </section>
  );
}