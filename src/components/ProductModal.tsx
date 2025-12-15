import { useState, useEffect } from 'react';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { Product, ProductColor, ProductVariant } from '../types';
import { STANDARD_COLORS, getColorHex } from '../utils/colorUtils';
import { cartService } from '../services/cart.service';
import { getDiscountDetails } from '../utils/productUtils';
import CountdownTimer from './CountdownTimer';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImage, setCurrentImage] = useState(product.imagem);
  const [hoveredProduct, setHoveredProduct] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { originalPrice, discountedPrice, isDiscountActive, savingsAmount, savingsPercentage, countdown, discountType } = getDiscountDetails(product);

  // 1. Filtrar variantes que têm estoque > 0
  const availableVariants = product.variants?.filter(v => v.estoque > 0) || [];
  
  // 2. Cores disponíveis (baseado em variantes com estoque)
  const availableColorsNames = Array.from(new Set(availableVariants.map(v => v.cor)));
  const availableColors = product.cores?.filter(c => availableColorsNames.includes(c.nome)) || [];

  // 3. Tamanhos disponíveis para a cor selecionada
  const availableSizes = selectedColor
    ? Array.from(new Set(availableVariants.filter(v => v.cor === selectedColor.nome).map(v => v.tamanho)))
    : [];

  // 4. Variante selecionada e estoque
  const selectedVariant = selectedColor && selectedSize
    ? availableVariants.find(v => v.cor === selectedColor.nome && v.tamanho === selectedSize)
    : null;

  const currentStock = selectedVariant?.estoque || 0;

  const canAddToCart = selectedColor && selectedSize && currentStock > 0 && quantity > 0 && quantity <= currentStock;

  // Efeito para inicializar seleção de cor/tamanho e resetar estados
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(null);
      setSelectedSize('');
      setCurrentImage(product.imagem);
      setQuantity(1);

      // Tenta pré-selecionar a primeira cor disponível
      if (availableColors.length > 0) {
        const firstColorConfig = availableColors[0];
        handleColorSelect(firstColorConfig, true); // Passa true para forçar a pré-seleção de tamanho
      }
    }
  }, [isOpen, product.id]);

  // Efeito para resetar a quantidade se o estoque mudar (ex: ao mudar cor/tamanho)
  useEffect(() => {
    if (currentStock === 0) {
      setQuantity(0);
    } else if (quantity === 0 && currentStock > 0) {
      setQuantity(1);
    } else if (quantity > currentStock) {
      setQuantity(currentStock);
    }
  }, [currentStock]);


  if (!isOpen) return null;

  const handleColorSelect = (colorConfig: ProductColor, forceSizeSelection: boolean = false) => {
    setSelectedColor(colorConfig);
    setSelectedSize('');

    // Filtra tamanhos disponíveis para a nova cor (apenas aqueles com estoque)
    const sizesForNewColor = availableVariants
      .filter(v => v.cor === colorConfig.nome)
      .map(v => v.tamanho);

    // Se houver apenas um tamanho disponível, pré-seleciona
    if (sizesForNewColor.length === 1 || forceSizeSelection) {
      setSelectedSize(sizesForNewColor[0] || '');
    }

    // Atualiza a imagem
    if (colorConfig.imagem) {
      setCurrentImage(colorConfig.imagem);
    } else {
      setCurrentImage(product.imagem);
    }
  };

  const handleAddToCartClick = () => {
    if (product && selectedColor && selectedSize && quantity > 0) {
      cartService.addItem(product, selectedColor, selectedSize, quantity);
      onAddToCart();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}> {/* Overlay mais escuro */}
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto relative rounded-lg shadow-2xl animate-fade-in-up" // Modal arredondado e com animação
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 p-2 transition-colors rounded-full shadow-md" // Botão de fechar arredondado
          title="Fechar"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          <div className="relative">
            <div className="w-full aspect-square bg-gray-100 overflow-hidden rounded-md"> {/* Imagem arredondada */}
              <img
                src={currentImage || 'https://via.placeholder.com/600x600?text=Sem+Imagem'}
                alt={product.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Sem+Imagem';
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-black mb-3">
              {product.nome}
            </h2>

            <div
              className="relative mb-4"
              onMouseEnter={() => setHoveredProduct(true)}
              onMouseLeave={() => setHoveredProduct(false)}
            >
              <p className="text-gray-600 text-sm sm:text-base line-clamp-3 cursor-help">
                {product.descricao}
              </p>

              {hoveredProduct && product.descricao && product.descricao.length > 100 && (
                <div className="absolute z-50 bottom-full left-0 right-0 mb-2 p-4 bg-gray-900 text-white text-sm rounded shadow-lg">
                  <p className="leading-relaxed">{product.descricao}</p>
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            {/* Preços e Desconto */}
            <div className="mb-6">
              {isDiscountActive ? (
                <>
                  <p className="text-sm text-gray-500 line-through">
                    De R$ {originalPrice.toFixed(2)}
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    Por R$ {discountedPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    Economia: R$ {savingsAmount.toFixed(2)}{' '}
                    {savingsPercentage && `(${savingsPercentage}%)`}
                  </p>
                  {countdown && (
                    <CountdownTimer
                      expirationDate={product.discountExpiresAt!}
                      className="text-xs text-red-500 font-medium mt-2"
                    />
                  )}
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2"> {/* Badge arredondado */}
                    Desconto Aplicado
                  </span>
                </>
              ) : (
                <p className="text-3xl font-bold text-black">
                  R$ {originalPrice.toFixed(2)}
                </p>
              )}
            </div>

            {availableColors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecione a Cor *
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((colorConfig) => (
                    <button
                      key={colorConfig.nome}
                      onClick={() => handleColorSelect(colorConfig)}
                      className={`flex items-center gap-2 px-4 py-2 border-2 transition-all rounded-full ${ // Botões de cor arredondados
                        selectedColor?.nome === colorConfig.nome
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-black'
                      }`}
                      title={colorConfig.nome}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorConfig.hex || getColorHex(colorConfig.nome) || '#CCCCCC' }}
                      ></div>
                      <span className="text-sm font-medium">{colorConfig.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedColor && availableSizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecione o Tamanho *
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((tamanho) => (
                    <button
                      key={tamanho}
                      onClick={() => setSelectedSize(tamanho)}
                      className={`px-6 py-2 border-2 font-medium transition-all rounded-full ${ // Botões de tamanho arredondados
                        selectedSize === tamanho
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-black'
                      }`}
                    >
                      {tamanho}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exibição de Estoque e Status */}
            {selectedColor && selectedSize ? (
              currentStock > 0 ? (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 font-semibold">
                    Disponível: <span className="font-bold">{currentStock}</span> unidade(s) em estoque.
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 font-semibold">
                    Esgotado nesta cor e tamanho.
                  </p>
                </div>
              )
            ) : (
              <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">
                  Selecione cor e tamanho para verificar a disponibilidade.
                </p>
              </div>
            )}

            {currentStock > 0 && selectedColor && selectedSize && (
              <div className="mb-6 flex items-center gap-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Quantidade:
                </label>
                <div className="flex items-center border border-gray-300 rounded-md"> {/* Controles de quantidade arredondados */}
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors rounded-l-md"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={currentStock} // Limitar pelo estoque
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}
                    className="p-2 hover:bg-gray-100 transition-colors rounded-r-md"
                    disabled={quantity >= currentStock}
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCartClick}
              disabled={!canAddToCart}
              className={`flex items-center justify-center gap-2 py-3 px-6 w-full font-medium text-base transition-colors rounded-md ${ // Botão de adicionar ao carrinho arredondado
                canAddToCart
                  ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}