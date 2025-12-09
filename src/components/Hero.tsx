import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Imagens do carrossel - placeholder com estética preto e branco
const heroImages = [
  'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=format&fit=crop&w=1920&q=80',
  'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=format&fit=crop&w=1920&q=80',
  'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=format&fit=crop&w=1920&q=80',
  'https://images.pexels.com/photos/1936854/pexels-photo-1936854.jpeg?auto=format&fit=crop&w=1920&q=80',
  'https://images.pexels.com/photos/914668/pexels-photo-914668.jpeg?auto=format&fit=crop&w=1920&q=80',
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Transição automática do carrossel a cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Navegação manual do carrossel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Rolar suavemente para a seção de catálogo
  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen md:h-[80vh] w-full overflow-hidden bg-black">
      {/* Carrossel de imagens */}
      <div className="relative h-full w-full">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Pollyana Basic Chic - Look ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {/* Overlay escuro para melhorar legibilidade do texto */}
            <div className="absolute inset-0 bg-black/50" /> {/* Overlay um pouco mais escuro */}
          </div>
        ))}
      </div>

      {/* Conteúdo sobreposto */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg"> {/* Mais negrito e sombra */}
          Pollyana Basic Chic
        </h1>
        <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl font-light tracking-wide drop-shadow-md"> {/* Mais espaçamento e sombra */}
          Moda básica, moderna e atemporal
        </p>
        <button
          onClick={scrollToCatalog}
          className="bg-white text-black px-10 py-4 text-lg font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-white shadow-lg uppercase tracking-wider" // Botão mais robusto
        >
          Ver Catálogo Completo
        </button>
      </div>

      {/* Setas de navegação */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 transition-all duration-300 rounded-full" // Setas arredondadas
        aria-label="Imagem anterior"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 transition-all duration-300 rounded-full" // Setas arredondadas
        aria-label="Próxima imagem"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Indicadores de slide (dots) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 transition-all duration-300 rounded-full ${ // Dots arredondados
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}