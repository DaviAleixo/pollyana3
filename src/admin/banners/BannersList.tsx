import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { bannersService } from '../../services/banners.service';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { Banner } from '../../types';

export default function BannersList() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Carrega todos os banners (não apenas os visíveis) para gerenciamento
    setBanners(bannersService.getAll(false));
  };

  const getLinkDescription = (banner: Banner) => {
    switch (banner.linkType) {
      case 'product':
        const product = productsService.getById(banner.linkedProductId!);
        return `Produto: ${product?.nome || 'Não encontrado'}`;
      case 'category':
        const category = categoriesService.getById(banner.linkedCategoryId!);
        return `Categoria: ${category?.nome || 'Não encontrada'}`;
      case 'external':
        return `Link Externo: ${banner.externalUrl}`;
      case 'informational':
        return 'Banner Informativo (sem link)';
      default:
        return 'Nenhum link';
    }
  };

  const handleDelete = (id: number, textOverlay?: string) => {
    if (window.confirm(`Deseja realmente excluir o banner "${textOverlay || id}"?`)) {
      bannersService.delete(id);
      loadData();
    }
  };

  const handleToggleVisibility = (id: number) => {
    bannersService.toggleVisibility(id);
    loadData();
  };

  const handleMoveBanner = (id: number, direction: 'up' | 'down') => {
    const currentBanners = bannersService.getAll(false); // Get all banners to reorder
    const index = currentBanners.findIndex(b => b.id === id);

    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < currentBanners.length) {
      // Swap orders
      const bannerToMove = currentBanners[index];
      const otherBanner = currentBanners[newIndex];

      bannersService.update(bannerToMove.id, { order: otherBanner.order });
      bannersService.update(otherBanner.id, { order: bannerToMove.order });
      
      loadData(); // Reload data to reflect new order
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Banners</h1>
          <p className="text-gray-600">
            Gerencie os banners promocionais e informativos do catálogo
          </p>
        </div>
        <Link
          to="/admin/banners/novo"
          className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
        >
          + Adicionar Banner
        </Link>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Imagem
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Texto
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Link
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Ordem
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                  Visível
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Nenhum banner cadastrado
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <img
                        src={banner.imageUrl || 'https://via.placeholder.com/100x50?text=Sem+Imagem'}
                        alt={banner.textOverlay || `Banner ${banner.id}`}
                        className="w-24 h-12 object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {banner.textOverlay || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getLinkDescription(banner)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveBanner(banner.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="font-semibold">{banner.order}</span>
                        <button
                          onClick={() => handleMoveBanner(banner.id, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(banner.id)}
                        className={`p-2 transition-colors ${
                          banner.isVisible
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={banner.isVisible ? 'Ocultar' : 'Mostrar'}
                      >
                        {banner.isVisible ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/banners/editar/${banner.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(banner.id, banner.textOverlay)}
                          className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}