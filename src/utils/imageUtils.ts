// Utilitários para manipulação de imagens
// Redimensionamento, compressão e conversão para base64

interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

// Configuração padrão para imagens de produtos
// Resolução recomendada: 1000x1000px (formato quadrado)
// Funciona perfeitamente em desktop, tablet e celular
const DEFAULT_RESIZE_OPTIONS: ResizeOptions = {
  maxWidth: 1000,
  maxHeight: 1000,
  quality: 0.90,
};

// Redimensionar e comprimir imagem mantendo proporção
export function resizeImage(
  file: File,
  options: Partial<ResizeOptions> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = { ...DEFAULT_RESIZE_OPTIONS, ...options };

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo não é uma imagem válida'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Criar canvas para redimensionamento
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > config.maxWidth) {
          width = config.maxWidth;
          height = width / aspectRatio;
        }

        if (height > config.maxHeight) {
          height = config.maxHeight;
          width = height * aspectRatio;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com compressão
        const resizedBase64 = canvas.toDataURL('image/jpeg', config.quality);
        resolve(resizedBase64);
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

// Validar tamanho máximo do arquivo (em MB)
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
}

// Validar tipo de arquivo
export function validateFileType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
}
