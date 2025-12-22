// Serviço de gerenciamento do carrinho de compras
// Centraliza a lógica de adicionar, remover, atualizar itens e calcular totais

import { CartItem, Product, ProductColor, ProductVariant, DiscountType, ShippingAddress, ShippingOption } from '../types';
import { storageService, STORAGE_KEYS } from './storage.service';
import { calculateDiscountedPrice, isDiscountValid } from '../utils/productUtils'; // Importar utilitários de desconto
import { showError } from '../utils/toast'; // Import toast utilities

const CART_STORAGE_KEY = 'pollyana_cart';

class CartService {
  // Obtém todos os itens do carrinho
  getCartItems(): CartItem[] {
    const items = storageService.get<CartItem[]>(CART_STORAGE_KEY);
    return items || [];
  }

  // Adiciona um item ao carrinho ou atualiza sua quantidade
  addItem(
    product: Product,
    selectedColor: ProductColor,
    selectedSize: string,
    quantity: number
  ): void {
    const items = this.getCartItems();
    const variant = product.variants?.find(
      (v) => v.cor === selectedColor.nome && v.tamanho === selectedSize
    );

    if (!variant) {
      console.error('Variação do produto não encontrada.');
      showError('Variação do produto não encontrada. Tente selecionar cor e tamanho novamente.');
      return;
    }

    // Calcular preços com e sem desconto no momento da adição
    const originalPriceAtAddToCart = product.preco;
    const discountedPriceAtAddToCart = calculateDiscountedPrice(product);
    const isDiscountCurrentlyValid = isDiscountValid(product);

    // Gerar um ID único para o item no carrinho (produto + cor + tamanho)
    const itemId = `${product.id}-${selectedColor.nome}-${selectedSize}`;

    const existingItemIndex = items.findIndex((item) => item.id === itemId);

    if (existingItemIndex > -1) {
      // Atualiza a quantidade se o item já existe
      const existingItem = items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > variant.estoque) {
        showError(`Não há estoque suficiente para adicionar ${quantity} unidades. Disponível: ${variant.estoque - existingItem.quantity}`);
        return;
      }

      items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
    } else {
      // Adiciona novo item
      if (quantity > variant.estoque) {
        showError(`Não há estoque suficiente para adicionar ${quantity} unidades. Disponível: ${variant.estoque}`);
        return;
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        productName: product.nome,
        productPrice: product.preco, // Preço original do produto
        selectedColorName: selectedColor.nome,
        selectedColorHex: selectedColor.hex,
        selectedColorImage: selectedColor.imagem || product.imagem, // Usar imagem da cor ou imagem principal do produto como fallback
        selectedSize: selectedSize,
        quantity: quantity,
        stockAvailable: variant.estoque,
        // Detalhes do desconto no momento da adição
        originalPriceAtAddToCart: originalPriceAtAddToCart,
        discountedPriceAtAddToCart: discountedPriceAtAddToCart,
        discountTypeAtAddToCart: isDiscountCurrentlyValid ? product.discountType : undefined,
        discountValueAtAddToCart: isDiscountCurrentlyValid ? product.discountValue : undefined,
        discountExpiresAtAtAddToCart: isDiscountCurrentlyValid ? product.discountExpiresAt : undefined,
      };
      items.push(newItem);
    }

    storageService.set(CART_STORAGE_KEY, items);
    window.dispatchEvent(new Event('storage')); // Notifica outros componentes sobre a mudança
  }

  // Atualiza a quantidade de um item específico no carrinho
  updateItemQuantity(itemId: string, newQuantity: number): void {
    const items = this.getCartItems();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex > -1) {
      const item = items[itemIndex];
      if (newQuantity > item.stockAvailable) {
        showError(`Não há estoque suficiente. Disponível: ${item.stockAvailable}`);
        return;
      }
      if (newQuantity <= 0) {
        this.removeItem(itemId); // Remove se a quantidade for 0 ou menos
      } else {
        items[itemIndex] = { ...item, quantity: newQuantity };
        storageService.set(CART_STORAGE_KEY, items);
        window.dispatchEvent(new Event('storage'));
      }
    }
  }

  // Remove um item do carrinho
  removeItem(itemId: string): void {
    const items = this.getCartItems();
    const updatedItems = items.filter((item) => item.id !== itemId);
    storageService.set(CART_STORAGE_KEY, updatedItems);
    window.dispatchEvent(new Event('storage'));
  }

  // Limpa todo o carrinho
  clearCart(): void {
    storageService.remove(CART_STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
  }

  // Retorna o número total de itens (quantidades somadas) no carrinho
  getTotalItems(): number {
    return this.getCartItems().reduce((total, item) => total + item.quantity, 0);
  }

  // Retorna o preço total de todos os itens no carrinho (considerando descontos)
  getTotalPrice(): number {
    return this.getCartItems().reduce(
      (total, item) => total + item.discountedPriceAtAddToCart * item.quantity,
      0
    );
  }

  // Retorna a economia total do carrinho
  getTotalSavings(): number {
    return this.getCartItems().reduce(
      (total, item) => total + (item.originalPriceAtAddToCart - item.discountedPriceAtAddToCart) * item.quantity,
      0
    );
  }

  // Gera a mensagem formatada para o WhatsApp, incluindo detalhes do frete
  generateWhatsAppMessage(shippingAddress: ShippingAddress | null, shippingOption: ShippingOption): string {
    const items = this.getCartItems();
    if (items.length === 0) {
      return 'Olá! Gostaria de fazer um pedido, mas meu carrinho está vazio.';
    }

    let message = 'Olá! Gostaria de finalizar meu pedido:\n\n';
    items.forEach((item, index) => {
      const itemSavings = (item.originalPriceAtAddToCart - item.discountedPriceAtAddToCart) * item.quantity;
      const isItemDiscounted = item.originalPriceAtAddToCart > item.discountedPriceAtAddToCart;

      message += `*Item ${index + 1}:*\n`;
      message += `  Produto: ${item.productName}\n`;
      message += `  Cor: ${item.selectedColorName}\n`;
      message += `  Tamanho: ${item.selectedSize}\n`;
      message += `  Quantidade: ${item.quantity}\n`;
      
      if (isItemDiscounted) {
        message += `  Preço original: R$ ${item.originalPriceAtAddToCart.toFixed(2)}\n`;
        message += `  Preço com desconto: R$ ${item.discountedPriceAtAddToCart.toFixed(2)}\n`;
        message += `  Economia: R$ ${itemSavings.toFixed(2)}\n`;
        if (item.discountTypeAtAddToCart === 'percentage' && item.discountValueAtAddToCart) {
          message += `  Desconto aplicado: ${item.discountValueAtAddToCart}%\n`;
        } else if (item.discountTypeAtAddToCart === 'fixed' && item.discountValueAtAddToCart) {
          message += `  Desconto aplicado: -R$ ${item.discountValueAtAddToCart.toFixed(2)}\n`;
        }
        if (item.discountExpiresAtAtAddToCart) {
          const expirationDate = new Date(item.discountExpiresAtAtAddToCart);
          message += `  *Desconto válido até: ${expirationDate.toLocaleDateString('pt-BR')}*\n`;
        }
      } else {
        message += `  Preço Unitário: R$ ${item.productPrice.toFixed(2)}\n`;
      }
      message += `  Subtotal: R$ ${(item.discountedPriceAtAddToCart * item.quantity).toFixed(2)}\n\n`;
    });

    const totalItemsPrice = this.getTotalPrice();
    const totalSavings = this.getTotalSavings();
    const finalTotal = totalItemsPrice + shippingOption.cost;

    message += `*Resumo do Pedido:*\n`;
    message += `  Subtotal dos produtos: R$ ${totalItemsPrice.toFixed(2)}\n`;
    if (totalSavings > 0) {
      message += `  Economia total nos produtos: -R$ ${totalSavings.toFixed(2)}\n`;
    }
    message += `  Frete (${shippingOption.label}): R$ ${shippingOption.cost.toFixed(2)}\n`;
    message += `  *Total Final: R$ ${finalTotal.toFixed(2)}*\n\n`;

    // Adicionar detalhes do endereço apenas se não for retirada na loja
    if (shippingOption.type === 'store_pickup') {
      message += `*Opção de Entrega:*\n`;
      message += `  Retirada na Loja\n`;
      message += `  Valor: R$ ${shippingOption.cost.toFixed(2)}\n\n`;
    } else if (shippingAddress) { // Só inclui endereço se não for retirada E o endereço estiver presente
      message += `*Endereço de Entrega:*\n`;
      message += `  CEP: ${shippingAddress.cep}\n`;
      message += `  Endereço: ${shippingAddress.logradouro}, ${shippingAddress.bairro}, ${shippingAddress.localidade} - ${shippingAddress.uf}\n`;
      message += `  Tipo de Frete: ${shippingOption.label}\n`;
      message += `  Valor do Frete: R$ ${shippingOption.cost.toFixed(2)}\n\n`;
    }
    
    message += 'Aguardando sua confirmação!';

    return message;
  }
}

export const cartService = new CartService();