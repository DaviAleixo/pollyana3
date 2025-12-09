// Utilitários para gerenciamento de cores padrão
// Define cores pré-definidas e suas representações visuais

export interface StandardColor {
  nome: string;
  hex: string;
}

// Cores padrão disponíveis no sistema
export const STANDARD_COLORS: StandardColor[] = [
  { nome: 'Branco', hex: '#FFFFFF' },
  { nome: 'Preto', hex: '#000000' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Verde', hex: '#10B981' },
  { nome: 'Rosa', hex: '#EC4899' },
  { nome: 'Amarelo', hex: '#FCD34D' },
  { nome: 'Cinza', hex: '#6B7280' },
  { nome: 'Bege', hex: '#D4B896' },
  { nome: 'Vermelho', hex: '#EF4444' },
  { nome: 'Roxo', hex: '#8B5CF6' },
  { nome: 'Laranja', hex: '#F97316' },
  { nome: 'Marrom', hex: '#7C2D12' },
];

// Verificar se uma cor é padrão
export function isStandardColor(colorName: string): boolean {
  return STANDARD_COLORS.some(color => color.nome === colorName);
}

// Obter código hexadecimal de uma cor padrão
export function getColorHex(colorName: string): string {
  const color = STANDARD_COLORS.find(c => c.nome === colorName);
  return color?.hex || '#CCCCCC';
}

// Função para obter o nome da cor a partir do código hexadecimal
export function getNearestColorName(hex: string): string {
  // Lista de cores comuns para mapeamento (pode ser expandida)
  const commonColors: StandardColor[] = [
    ...STANDARD_COLORS,
    { nome: 'Ciano', hex: '#06B6D4' },
    { nome: 'Magenta', hex: '#D946EF' },
    { nome: 'Lima', hex: '#84CC16' },
    { nome: 'Ouro', hex: '#D97706' },
    { nome: 'Prata', hex: '#9CA3AF' },
    { nome: 'Índigo', hex: '#4F46E5' },
    { nome: 'Turquesa', hex: '#14B8A6' },
    { nome: 'Violeta', hex: '#7C3AED' },
  ];

  // Normalizar o hex para remover '#' e garantir 6 dígitos
  const normalizedHex = hex.startsWith('#') ? hex.substring(1) : hex;
  if (normalizedHex.length === 3) {
    // Expandir shorthand hex (e.g., 'F00' -> 'FF0000')
    const r = normalizedHex[0];
    const g = normalizedHex[1];
    const b = normalizedHex[2];
    hex = `#${r}${r}${g}${g}${b}${b}`;
  } else if (normalizedHex.length === 6) {
    hex = `#${normalizedHex}`;
  } else {
    return hex; // Retorna o próprio hex se não for um formato válido
  }

  let minDistance = Infinity;
  let nearestColorName = hex; // Padrão para o próprio hex se não encontrar nome

  // Função para calcular a distância euclidiana entre duas cores RGB
  const hexToRgb = (h: string) => {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (h.length === 4) {
      r = parseInt(h[1] + h[1], 16);
      g = parseInt(h[2] + h[2], 16);
      b = parseInt(h[3] + h[3], 16);
    }
    // 6 digits
    else if (h.length === 7) {
      r = parseInt(h.substring(1, 3), 16);
      g = parseInt(h.substring(3, 5), 16);
      b = parseInt(h.substring(5, 7), 16);
    }
    return { r, g, b };
  };

  const targetRgb = hexToRgb(hex);

  for (const color of commonColors) {
    const compareRgb = hexToRgb(color.hex);
    const distance = Math.sqrt(
      Math.pow(targetRgb.r - compareRgb.r, 2) +
      Math.pow(targetRgb.g - compareRgb.g, 2) +
      Math.pow(targetRgb.b - compareRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestColorName = color.nome;
    }
  }

  // Se a distância for muito grande, talvez seja melhor usar o próprio hex
  // O valor 50 é arbitrário e pode ser ajustado
  if (minDistance > 100) { 
    return hex.toUpperCase();
  }

  return nearestColorName;
}