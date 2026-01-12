import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Truck, Store } from 'lucide-react'; // Importar Store icon
import { cartService } from '../services/cart.service';
import { shippingService } from '../services/shipping.service';
import { clicksService } from '../services/clicks.service'; // Importar clicksService
import { CartItem, ShippingAddress, ShippingOption } from '../types';
import CountdownTimer from '../components/CountdownTimer';
import CepInput from '../components/CepInput';
import { showError, showSuccess, showConfirm } from '../utils/toast.tsx'; // Importar showConfirm

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // NOVOS ESTADOS PARA NÚMERO E COMPLEMENTO
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');

  const loadCart = useCallback(() => {
    const items = cartService.getCartItems();
    setCartItems(items);
    const currentSubtotal = cartService.getTotalPrice();
    setSubtotal(currentSubtotal);
    setTotalSavings(cartService.getTotalSavings());

    const currentShippingCost = selectedShippingOption && typeof selectedShippingOption.cost === 'number' ? selectedShippingOption.cost : 0;
    setTotalPrice(currentSubtotal + currentShippingCost);
  }, [selectedShippingOption]);

  useEffect(() => {
    loadCart();

    window.addEventListener('storage', loadCart);

    return () => {
      window.removeEventListener('storage', loadCart);
    };
  }, [loadCart]);

  // Efeito para recalcular opções de frete e resetar número/complemento se o endereço mudar
  useEffect(() => {
    // Resetar número e complemento ao buscar novo CEP
    setNumero('');
    setComplemento('');

    const options = shippingService.calculateShippingOptions(shippingAddress);
    
    Promise.resolve(options).then(resolvedOptions => {
      setShippingOptions(resolvedOptions);

      let newSelectedOption: ShippingOption | null = null;

      if (shippingAddress) {
        // Se um endereço foi encontrado (após a busca do CEP), priorizamos a Entrega Local
        const localOption = resolvedOptions.find(opt => opt.type === 'local');
        if (localOption) {
          newSelectedOption = localOption;
        } else if (resolvedOptions.length > 0) {
          // Se não houver Entrega Local (CEP fora da cidade da loja), seleciona a primeira (Retirada na Loja)
          newSelectedOption = resolvedOptions[0];
        }
      } else {
        // Se não há endereço (CEP limpo ou inválido), tentamos manter a seleção anterior
        newSelectedOption = selectedShippingOption && resolvedOptions.find(opt => opt.type === selectedShippingOption.type);
        
        // Se não houver seleção anterior válida, seleciona a primeira opção disponível (Retirada na Loja)
        if (!newSelectedOption && resolvedOptions.length > 0) {
            newSelectedOption = resolvedOptions[0];
        }
      }
      
      setSelectedShippingOption(newSelectedOption || null);
    });
  }, [shippingAddress]); // Depende apenas do shippingAddress

  useEffect(() => {
    const currentShippingCost = selectedShippingOption && typeof selectedShippingOption.cost === 'number' ? selectedShippingOption.cost : 0;
    setTotalPrice(subtotal + currentShippingCost);
  }, [subtotal, selectedShippingOption]);


  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      cartService.updateItemQuantity(itemId, item.quantity + delta);
    }
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    showConfirm(
      `Deseja remover o item "${productName}" do carrinho?`,
      () => {
        cartService.removeItem(itemId);
        showSuccess('Item removido do carrinho.');
      },
      'Remover'
    );
  };

  const handleFinalizeOrder = async () => {
    if (!selectedShippingOption) {
      showError('Por favor, selecione uma opção de frete para finalizar o pedido.');
      return;
    }

    // Se a opção for entrega (não retirada na loja) E não houver endereço, impede a finalização
    if (selectedShippingOption.type !== 'store_pickup' && !shippingAddress) {
      showError('Por favor, informe o CEP para entrega ou selecione Retirada na Loja.');
      return;
    }
    
    // Se for entrega e o número não foi preenchido
    if (selectedShippingOption.type !== 'store_pickup' && shippingAddress && !numero.trim()) {
        showError('Por favor, preencha o número do endereço para entrega.');
        return;
    }

    // 1. Registrar cliques para cada produto único no carrinho
    const uniqueProductIds = Array.from(new Set(cartItems.map(item => item.productId)));
    
    await Promise.all(uniqueProductIds.map(productId => clicksService.registerClick(productId)));

    // 2. Criar objeto ShippingAddress completo para a mensagem
    const finalAddress: ShippingAddress | null = shippingAddress
        ? {
            ...shippingAddress,
            numero: numero.trim(),
            complemento: complemento.trim(),
          }
        : null;

    // 3. Gerar mensagem e redirecionar
    const whatsappMessage = cartService.generateWhatsAppMessage(finalAddress, selectedShippingOption);
    const phoneNumber = '5531983921200';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, '_blank');
    cartService.clearCart();
    setShippingAddress(null);
    setSelectedShippingOption(null);
    setNumero('');
    setComplemento('');
    showSuccess('Pedido enviado para o WhatsApp! Carrinho limpo.');
  };

  // Lógica de habilitação do botão
  const isCartEmpty = cartItems.length === 0;
  const isShippingSelected = !!selectedShippingOption;
  const isAddressRequired = isShippingSelected && selectedShippingOption.type !== 'store_pickup';
  const isAddressValid = !isAddressRequired || (!!shippingAddress && (selectedShippingOption?.type === 'store_pickup' || numero.trim() !== ''));
  const canFinalize = !isCartEmpty && isShippingSelected && isAddressValid;

  const getDisabledReason = () => {
    if (isCartEmpty) return 'Seu carrinho está vazio.';
    if (!isShippingSelected) return 'Selecione uma opção de frete.';
    if (isAddressRequired && !shippingAddress) return 'Informe o CEP para entrega ou selecione Retirada na Loja.';
    if (isAddressRequired && shippingAddress && !numero.trim()) return 'Preencha o número do endereço.';
    return '';
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Continuar Comprando
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-black mb-4">
            Seu Carrinho
          </h1>
          <p className="text-gray-600 text-lg">
            Revise os itens e finalize seu pedido
          </p>
        </div>

        {isCartEmpty ? (
          <div className="bg-white border border-gray-200 p-8 text-center rounded-lg shadow-md">
            <p className="text-gray-600 text-xl mb-4">Seu carrinho está vazio.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors font-medium rounded-md"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Itens do Carrinho */}
            <div className="lg:col-span-2 bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-md">
              {cartItems.map((item) => {
                const itemSavings = item.originalPriceAtAddToCart - item.discountedPriceAtAddToCart;
                const isItemDiscounted = item.originalPriceAtAddToCart > item.discountedPriceAtAddToCart;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
                    {/* Imagem */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 overflow-hidden rounded-md">
                      <img
                        src={item.selectedColorImage || 'https://via.placeholder.com/100x100?text=Sem+Imagem'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detalhes do Item */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-semibold text-lg text-black">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Cor: {item.selectedColorName}</p>
                      <p className="text-sm text-gray-600">Tamanho: {item.selectedSize}</p>
                      
                      {isItemDiscounted ? (
                        <>
                          <p className="text-sm text-gray-500 line-through">
                            De: R$ {item.originalPriceAtAddToCart.toFixed(2)}
                          </p>
                          <p className="font-bold text-red-600 mt-1">
                            Por: R$ {item.discountedPriceAtAddToCart.toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600 font-semibold">
                            Economia: R$ {itemSavings.toFixed(2)}
                          </p>
                          {item.discountExpiresAtAtAddToCart && (
                            <CountdownTimer
                              expirationDate={item.discountExpiresAtAtAddToCart}
                              className="text-xs text-red-500 font-medium mt-1"
                            />
                          )}
                        </>
                      ) : (
                        <p className="font-bold text-black mt-1">R$ {item.productPrice.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Controles de Quantidade e Remover */}
                    <div className="flex flex-col items-center sm:items-end gap-2 mt-4 sm:mt-0">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-2 hover:bg-gray-100 transition-colors rounded-l-md"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                        </button>
                        <span className="w-8 text-center py-2 border-x border-gray-300 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-2 hover:bg-gray-100 transition-colors rounded-r-md"
                          disabled={item.quantity >= item.stockAvailable}
                        >
                          <Plus className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.productName)}
                        className="text-red-600 hover:text-red-800 p-1 transition-colors rounded-full"
                        title="Remover item"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo da Compra e Frete */}
            <div className="bg-white border border-gray-200 p-6 h-fit lg:sticky lg:top-20 rounded-lg shadow-md">
              <h2 className="font-serif text-2xl font-bold text-black mb-4">
                Resumo do Pedido
              </h2>
              
              {/* Seção de CEP e Frete */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                {/* CEP Input sempre visível */}
                <CepInput onAddressChange={setShippingAddress} className="mb-4" />

                {/* Campos de Número e Complemento (visíveis se o endereço for encontrado) */}
                {shippingAddress && (
                    <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-in">
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Número *
                            </label>
                            <input
                                type="text"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black rounded-md"
                                placeholder="Nº"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Complemento (opcional)
                            </label>
                            <input
                                type="text"
                                value={complemento}
                                onChange={(e) => setComplemento(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black rounded-md"
                                placeholder="Apto, Bloco, Referência"
                            />
                        </div>
                    </div>
                )}

                {shippingOptions.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Opções de Frete
                    </label>
                    {shippingOptions.map(option => (
                      <label key={option.type} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 hover:bg-gray-50 transition-colors rounded-md">
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={selectedShippingOption?.type === option.type}
                          onChange={() => setSelectedShippingOption(option)}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-600">
                            {option.deliveryTime && <span>{option.deliveryTime} • </span>}
                            <span className="font-semibold">R$ {typeof option.cost === 'number' ? option.cost.toFixed(2) : 'N/A'}</span>
                          </p>
                        </div>
                        {option.type === 'store_pickup' ? (
                          <Store className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                        ) : (
                          <Truck className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {shippingOptions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    Nenhuma opção de frete disponível.
                  </p>
                )}
              </div>

              {/* Detalhes do Total */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-base text-gray-700">Subtotal:</p>
                  <p className="text-base text-gray-700">R$ {subtotal.toFixed(2)}</p>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-base text-green-600 font-semibold">Economia Total:</p>
                    <p className="text-base text-green-600 font-semibold">- R$ {totalSavings.toFixed(2)}</p>
                  </div>
                )}
                {selectedShippingOption && typeof selectedShippingOption.cost === 'number' && (
                  <div className="flex justify-between items-center">
                    <p className="text-base text-gray-700">Frete ({selectedShippingOption.label}):</p>
                    <p className="text-base text-gray-700">R$ {selectedShippingOption.cost.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xl font-bold text-black">Total:</p>
                  <p className="text-xl font-bold text-black">R$ {totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={handleFinalizeOrder}
                disabled={!canFinalize}
                className="w-full bg-green-600 text-white px-6 py-3 mt-6 hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                title={!canFinalize ? getDisabledReason() : 'Finalizar pedido no WhatsApp'}
              >
                <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-5 h-5" />
                Finalizar Pedido no WhatsApp
              </button>
              {!canFinalize && (
                <p className="text-xs text-red-600 mt-2 text-center font-semibold">
                  {getDisabledReason()}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-3 text-center">
                Você será redirecionado para o WhatsApp com os detalhes do seu pedido.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}