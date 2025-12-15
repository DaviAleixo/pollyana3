import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { productsService } from '../services/products.service';
import { Product } from '../types';
import LaunchProductCard from './LaunchProductCard';
import ProductModal from './ProductModal';
import { clicksService } from '../services/clicks.service';
import SectionTitle from './SectionTitle';

export default function NewArrivalsCarousel() {
  const [launches, setLaunches] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLaunches = async () => {
      try {
        setLoading(true);
        const fetchedLaunches = await productsService.getLaunches();
        // Garante que sempre seja um array
        setLaunches(Array.isArray(fetchedLaunches) ? fetchedLaunches : []);
      } catch (error) {
        console.error('Erro ao carregar lançamentos:', error);
        setLaunches([]);
      } finally {
        setLoading(false);
      }
    };

    loadLaunches();

    // Recarrega quando houver mudanças no storage
    window.addEventListener('storage', loadLaunches);
    return () => {
      window.removeEventListener('storage', loadLaunches);
    };
  }, []);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  // Ação vazia, pois o clique agora é centralizado na finalização do carrinho (CartPage.tsx)
  const handleAddToCart = () => {
    // clicksService.registerClick(selectedProduct.id); // REMOVIDO
  };

  // Implementação simples de scroll horizontal
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'right' ? 300 : -300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Exibe loading enquanto carrega
  if (loading) {
    return (
      <section className="bg-gray-50 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="LANÇAMENTOS DA LOJA" className="mb-10" />
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </section>
    );
  }

  // Não exibe nada se não houver lançamentos
  if (!Array.isArray(launches) || launches.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-12 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle title="LANÇAMENTOS DA LOJA" className="mb-10" />
        <div className="relative">
          {/* Botões de navegação */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-3 shadow-lg rounded-full border border-gray-200 hover:bg-gray-100 transition-colors hidden md:block"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-3 shadow-lg rounded-full border border-gray-200 hover:bg-gray-100 transition-colors hidden md:block"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>

          {/* Carrossel de Produtos */}
          <div
            ref={carouselRef}
            className="flex overflow-x-scroll space-x-4 sm:space-x-6 pb-4 px-2 -mx-2 md:px-0 md:-mx-0 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {launches.map((product) => (
              <LaunchProductCard
                key={product.id}
                product={product}
                onOpenModal={handleOpenModal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Seleção */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </section>
  );
}