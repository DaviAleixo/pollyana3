import { Product, DiscountType } from '../types';

// Função auxiliar para criar um objeto Date interpretado no fuso horário local
// Isso resolve o problema de 3 horas (UTC vs Local) ao analisar strings ISO sem fuso.
function createLocalDate(dbString: string): Date {
  if (!dbString) return new Date(0);

  // Match DB format: YYYY-MM-DD HH:MM:SS
  const parts = dbString.match(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/);
  
  if (parts) {
    // Constrói o Date usando componentes locais (Ano, MêsIndex, Dia, Hora, Minuto, Segundo)
    // Isso força a interpretação no fuso horário local do ambiente de execução.
    return new Date(
      parseInt(parts[1]), // Ano
      parseInt(parts[2]) - 1, // Mês (0-11)
      parseInt(parts[3]), // Dia
      parseInt(parts[4]), // Hora
      parseInt(parts[5]), // Minuto
      parseInt(parts[6]) // Segundo
    );
  }
  
  // Fallback para formatos inesperados
  return new Date(dbString); 
}

/**
 * Verifica se um desconto está ativo e não expirou.
 * @param product O objeto Product.
 * @returns true se o desconto estiver ativo e válido, false caso contrário.
 */
export function isDiscountValid(product: Product): boolean {
  if (!product.discountActive || !product.discountValue || product.discountValue <= 0) {
    return false;
  }

  if (product.discountExpiresAt) {
    const expirationDate = createLocalDate(product.discountExpiresAt); 
    if (expirationDate < new Date()) {
      return false; // Desconto expirou
    }
  }
  return true;
}

/**
 * Verifica se um produto é um lançamento válido (ativo, marcado como lançamento e não expirado).
 * @param product O objeto Product.
 * @returns true se o produto for um lançamento válido, false caso contrário.
 */
export function isLaunchValid(product: Product): boolean {
  if (!product.isLaunch || !product.ativo || !product.visivel) {
    return false;
  }
  if (product.launchExpiresAt) {
    const expirationDate = createLocalDate(product.launchExpiresAt); 
    if (expirationDate < new Date()) {
      return false; // Lançamento expirado
    }
  }
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
 * @returns Uma string formatada (ex: "2d 14h 33m") ou null se expirado/inválido.
 */
export function formatCountdown(expirationDateString?: string): string | null {
  if (!expirationDateString) return null;

  const expirationDate = createLocalDate(expirationDateString); 
  const now = new Date();
  const diff = expirationDate.getTime() - now.getTime();

  if (diff <= 0) {
    return null; // Desconto expirado
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${remainingMinutes}m`;
  } else {
    // Se for menos de 1 minuto, mostra em segundos
    const remainingSeconds = seconds % 60;
    return `${remainingSeconds}s`;
  }
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
  const countdown = formatCountdown(product.discountExpiresAt);

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