import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu } from 'lucide-react';
import { cartService } from '../services/cart.service';
import SearchBar from './SearchBar';
import logoImage from '/attached_assets/WhatsApp_Image_2025-11-25_at_15.53.40-removebg-preview_1765314447113.png';

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
    <nav className={`fixed top-0 left-0 w-full bg-white z-40 py-2 px-4 transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden flex-shrink-0"
          aria-label="Abrir menu de categorias"
          data-testid="button-menu-toggle"
        >
          <Menu className="w-6 h-6 text-black" strokeWidth={1.5} />
        </button>

        <Link to="/" className="flex-1 flex justify-center lg:flex-none lg:justify-start" data-testid="link-home">
          <img 
            src={logoImage} 
            alt="Pollyana Basic Chic" 
            className="h-12 md:h-14 w-auto object-contain"
          />
        </Link>

        <div className="hidden lg:flex flex-1 justify-center mx-8">
          <SearchBar
            onSearchTermChange={onSearchTermChange}
            initialSearchTerm={searchTerm}
            className="max-w-lg w-full"
          />
        </div>

        <Link to="/carrinho" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" aria-label="Ver Carrinho" data-testid="link-cart">
          <ShoppingBag className="w-6 h-6 text-black" strokeWidth={1.5} />
          {totalItemsInCart > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce-once" data-testid="badge-cart-count">
              {totalItemsInCart}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}