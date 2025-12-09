import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, FolderOpen, Eye, MousePointerClick } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { clicksService } from '../services/clicks.service';

// Dashboard principal do painel administrativo
// Exibe resumo de estatísticas e links rápidos

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    visibleProducts: 0,
    totalCategories: 0,
    totalClicks: 0,
  });

  useEffect(() => {
    // Carregar estatísticas
    const products = productsService.getAll();
    const visibleProducts = productsService.getVisible();
    const categories = categoriesService.getAll();
    const clicks = clicksService.getAll();

    const totalClicks = Object.values(clicks).reduce(
      (sum, item) => sum + item.clicks,
      0
    );

    setStats({
      totalProducts: products.length,
      visibleProducts: visibleProducts.length,
      totalCategories: categories.length,
      totalClicks,
    });
  }, []);

  // Cards de estatísticas
  const statCards = [
    {
      icon: Package,
      label: 'Total de Produtos',
      value: stats.totalProducts,
      link: '/admin/produtos',
      color: 'bg-black',
    },
    {
      icon: Eye,
      label: 'Produtos Visíveis',
      value: stats.visibleProducts,
      link: '/admin/produtos',
      color: 'bg-gray-700',
    },
    {
      icon: FolderOpen,
      label: 'Categorias',
      value: stats.totalCategories,
      link: '/admin/categorias',
      color: 'bg-gray-600',
    },
    {
      icon: MousePointerClick,
      label: 'Total de Cliques',
      value: stats.totalClicks,
      link: '/admin/relatorios',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral do catálogo Pollyana Basic Chic
        </p>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              to={card.link}
              className={`${card.color} text-white p-6 hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <p className="text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-white/80 text-sm">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Links rápidos */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/produtos/novo"
            className="border-2 border-black text-black px-4 py-3 text-center hover:bg-black hover:text-white transition-colors"
          >
            + Adicionar Produto
          </Link>
          <Link
            to="/admin/categorias/novo"
            className="border-2 border-black text-black px-4 py-3 text-center hover:bg-black hover:text-white transition-colors"
          >
            + Adicionar Categoria
          </Link>
          <Link
            to="/admin/relatorios"
            className="border-2 border-black text-black px-4 py-3 text-center hover:bg-black hover:text-white transition-colors"
          >
            Ver Relatórios
          </Link>
        </div>
      </div>
    </div>
  );
}
