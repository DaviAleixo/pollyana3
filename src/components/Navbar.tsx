import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu } from 'lucide-react';
import { cartService } from '../services/cart.service'; // Corrigido de '=>' para 'from'
import SearchBar from './SearchBar';

interface NavbarProps {
  onMenuToggle: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function Navbar({ onMenuToggle, searchTerm, onSearchTermChange }: NavbarProps) {
  const [totalItemsInCart, setTotalItemsInCart] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      setTotalItemsInCart(cartService.getTotalItems());
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    updateCartCount();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full bg-white z-40 py-4 px-4 transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Botão do Menu Hambúrguer (visível apenas em telas pequenas, à esquerda) */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden flex-shrink-0"
          aria-label="Abrir menu de categorias"
        >
          <Menu className="w-6 h-6 text-black" strokeWidth={1.5} />
        </button>

        {/* Nome da Marca (Centralizado no mobile, esquerda no desktop) */}
        <Link to="/" className="font-serif text-2xl font-bold text-black hover:text-gray-800 transition-colors tracking-wide
          flex-1 text-center lg:flex-none lg:text-left"> {/* flex-1 text-center para mobile, lg:flex-none lg:text-left para desktop */}
          Pollyana Basic Chic
        </Link>

        {/* SearchBar (Centralizado no desktop, oculto no mobile) */}
        <div className="hidden lg:flex flex-1 justify-center mx-8">
          <SearchBar
            onSearchTermChange={onSearchTermChange}
            initialSearchTerm={searchTerm}
            className="max-w-lg w-full"
          />
        </div>

        {/* Ícone do Carrinho (Direita) */}
        <Link to="/carrinho" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" aria-label="Ver Carrinho">
          <ShoppingBag className="w-6 h-6 text-black" strokeWidth={1.5} />
          {totalItemsInCart > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce-once">
              {totalItemsInCart}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}