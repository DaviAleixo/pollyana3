import { Product, DiscountType } from '../types';

// Funções de data removidas, pois não são mais necessárias para expiração.

/**
 * Verifica se um desconto está ativo.
 * @param product O objeto Product.
 * @returns true se o desconto estiver ativo e válido, false caso contrário.
 */
export function isDiscountValid(product: Product): boolean {
  if (!product.discountActive || !product.discountValue || product.discountValue <= 0) {
    return false;
  }
  // A validação de data de expiração foi removida.
  return true;
}

/**
 * Verifica se um produto é um lançamento válido (ativo e marcado como lançamento).
 * @param product O objeto Product.
 * @returns true se o produto for um lançamento válido, false caso contrário.
 */
export function isLaunchValid(product: Product): boolean {
  if (!product.isLaunch || !product.ativo || !product.visivel) {
    return false;
  }
  // A validação de data de expiração foi removida.
  return true;
}

/**
 * Calcula o preço com desconto de um produto.
 * @param product O objeto Product.
 * @returns O preço com desconto ou o preço original se não houver desconto válido.
 */
export function calculateDiscountedPrice(product: Product): number {
  if (!isDiscountValid(product)) {
    return product.preco;
  }

  let discountedPrice = product.preco;

  if (product.discountType === 'percentage' && product.discountValue) {
    discountedPrice = product.preco * (1 - product.discountValue / 100);
  } else if (product.discountType === 'fixed' && product.discountValue) {
    discountedPrice = product.preco - product.discountValue;
  }

  // Garantir que o preço final nunca seja negativo
  return Math.max(0, discountedPrice);
}

/**
 * Formata o tempo restante para a expiração do desconto.
 * @param expirationDateString A data de expiração no formato ISO string (local).
 * @returns null (Funcionalidade removida)
 */
export function formatCountdown(expirationDateString?: string): string | null {
  return null; // Funcionalidade de countdown removida
}

/**
 * Retorna os detalhes completos do desconto para exibição.
 * @param product O objeto Product.
 * @returns Um objeto com originalPrice, discountedPrice, savingsAmount, savingsPercentage, isDiscountActive, countdown.
 */
export function getDiscountDetails(product: Product) {
  const originalPrice = product.preco;
  const discountedPrice = calculateDiscountedPrice(product);
  const isDiscountActive = isDiscountValid(product);
  const savingsAmount = isDiscountActive ? originalPrice - discountedPrice : 0;
  const countdown = formatCountdown(product.discountExpiresAt); // Sempre será null

  let savingsPercentage: number | null = null;
  if (isDiscountActive && product.discountType === 'percentage' && product.discountValue) {
    savingsPercentage = product.discountValue;
  } else if (isDiscountActive && savingsAmount > 0) {
    savingsPercentage = (savingsAmount / originalPrice) * 100;
  }

  return {
    originalPrice,
    discountedPrice,
    savingsAmount,
    savingsPercentage: savingsPercentage ? Math.round(savingsPercentage) : null,
    isDiscountActive,
    countdown,
    discountType: product.discountType,
  };
}