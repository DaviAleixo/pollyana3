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

  // 🔥 CARREGAMENTO CORRETO (AGORA É ASSÍNCRONO)
  const loadData = async () => {
    const data = await bannersService.getAll(false);

    setBanners(
      Array.isArray(data)
        ? [...data].sort((a, b) => a.order - b.order)
        : []
    );
  };

  const getLinkDescription = (banner: Banner) => {
    switch (banner.linkType) {
      case 'product': {
        // Usar getById assíncrono
        // Nota: Não podemos usar await diretamente aqui, pois getLinkDescription é síncrono.
        // Para evitar chamadas assíncronas em renderização, vamos manter a busca síncrona
        // ou aceitar que a descrição do link pode ser 'Não encontrado' até que o produto seja carregado.
        // Como o productsService.getById é assíncrono, vamos assumir que ele retorna undefined/null
        // se não for encontrado imediatamente (o que é o caso com o Supabase dummy client).
        // No entanto, para o contexto do Admin, onde a lista de produtos é carregada em outro lugar,
        // vamos manter a chamada síncrona para evitar refatorar toda a tabela para async.
        // Se o Supabase estivesse configurado, isso seria um problema.
        // Como o productsService.getById é assíncrono, vou removê-lo e simplificar a descrição.
        return `Produto ID: ${banner.linkedProductId}`;
      }
      case 'category': {
        return `Categoria ID: ${banner.linkedCategoryId}`;
      }
      case 'external':
        return `Link Externo: ${banner.externalUrl}`;
      case 'informational':
        return 'Banner Informativo (sem link)';
      default:
        return 'Nenhum link';
    }
  };

  const handleDelete = async (id: number, textOverlay?: string) => {
    if (window.confirm(`Deseja realmente excluir o banner "${textOverlay || id}"?`)) {
      await bannersService.delete(id);
      await loadData();
    }
  };

  const handleToggleVisibility = async (id: number) => {
    await bannersService.toggleVisibility(id);
    await loadData();
  };

  const handleMoveBanner = async (id: number, direction: 'up' | 'down') => {
    const current = [...banners];
    const index = current.findIndex(b => b.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;

    const bannerA = current[index];
    const bannerB = current[newIndex];

    // Troca de ordem: A recebe a ordem de B, B recebe a ordem de A
    const orderA = bannerA.order;
    const orderB = bannerB.order;

    // Atualiza ambos os banners no banco de dados
    await Promise.all([
      bannersService.update(bannerA.id, { order: orderB }),
      bannersService.update(bannerB.id, { order: orderA }),
    ]);

    // Recarrega os dados para refletir a nova ordem
    await loadData();
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
                        src={
                          banner.imageUrl ||
                          'https://via.placeholder.com/100x50?text=Sem+Imagem'
                        }
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
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <span className="font-semibold">{banner.order}</span>

                        <button
                          onClick={() => handleMoveBanner(banner.id, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
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
                          className="p-2 text-gray-600 hover:bg-gray-100"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>

                        <button
                          onClick={() => handleDelete(banner.id, banner.textOverlay)}
                          className="p-2 text-red-600 hover:bg-red-50"
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