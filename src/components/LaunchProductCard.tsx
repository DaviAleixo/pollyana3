import React from 'react';
import { Eye } from 'lucide-react';
import { Product } from '../types';
import { getDiscountDetails } from '../utils/productUtils';
import ProductModal from './ProductModal';
import { clicksService } from '../services/clicks.service';

interface LaunchProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export default function LaunchProductCard({ product, onOpenModal }: LaunchProductCardProps) {
  const { originalPrice, discountedPrice, isDiscountActive, savingsPercentage } = getDiscountDetails(product);

  const handleOpenModal = () => {
    onOpenModal(product);
  };

  return (
    <div
      key={product.id}
      className="group bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg w-[250px] sm:w-[300px] flex-shrink-0 snap-center"
    >
      {/* Imagem do produto */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center"> {/* Adicionado flex items-center justify-center */}
        <img
          src={product.imagem || 'https://via.placeholder.com/600x600?text=Sem+Imagem'}
          alt={product.nome}
          className="w-full h-full object-contain transition-transform duration-500" // Alterado para object-contain
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Sem+Imagem';
          }}
        />
        {/* Selo de Lançamento */}
        <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
          NOVO
        </span>
        {isDiscountActive && (
          <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {savingsPercentage ? `${savingsPercentage}% OFF` : 'Promoção'}
          </span>
        )}
      </div>

      {/* Informações do produto */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="font-garamond text-xl sm:text-2xl font-semibold text-black mb-2 h-14 line-clamp-2">
          {product.nome}
        </h3>

        <p className="text-gray-600 text-xs sm:text-sm mb-3 h-8 line-clamp-2 whitespace-pre-wrap"> {/* Aumentado h-5 para h-8 e line-clamp-1 para line-clamp-2 */}
          {product.descricao}
        </p>

        {/* Preço */}
        <div className="mb-3 sm:mb-4">
          {isDiscountActive ? (
            <>
              <p className="text-sm text-gray-500 line-through">
                De R$ {originalPrice.toFixed(2)}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                Por R$ {discountedPrice.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-black">
              R$ {originalPrice.toFixed(2)}
            </p>
          )}
        </div>

        {/* Espaço flexível para empurrar botão para baixo */}
        <div className="flex-grow"></div>

        {/* Botão Ver Item */}
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 bg-black text-white py-2.5 sm:py-3 px-3 sm:px-4 w-full hover:bg-gray-800 transition-colors duration-300 font-medium mt-auto text-sm sm:text-base rounded-md"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
          <span className="whitespace-nowrap">Ver Item</span>
        </button>
      </div>
    </div>
  );
}