import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);

  // Número do WhatsApp da loja
  const whatsappNumber = '5531982607426';
  const whatsappMessage = 'Olá! Vim do site da Pollyana Basic Chic e gostaria de mais informações.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-600 text-white p-4 shadow-xl hover:scale-110 transition-transform duration-300 group rounded-full animate-pulse-subtle" // Cor verde, sombra mais suave e animação
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Fale conosco no WhatsApp"
    >
      {/* Ícone do WhatsApp */}
      <MessageCircle
        className="w-7 h-7"
        strokeWidth={1.5} // Ícone mais fino
        fill={isHovered ? 'white' : 'none'}
      />

      {/* Tooltip que aparece ao passar o mouse */}
      <span
        className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-green-700 text-white px-4 py-2 text-sm whitespace-nowrap transition-opacity duration-300 rounded-md ${ // Cor verde mais escura para o tooltip
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        Fale conosco!
      </span>
    </a>
  );
}