import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCatalog from './components/ProductCatalog';
import Benefits from './components/Benefits';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // Importação já existente
// SearchBar não é mais importado aqui, pois foi movido para Navbar
import CategoryNavbar from './components/CategoryNavbar';
import CartPage from './pages/CartPage';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ProductsList from './admin/products/ProductsList';
import ProductFormNew from './admin/products/ProductFormNew';
import CategoriesList from './admin/categories/CategoriesList';
import CategoryForm from './admin/categories/CategoryForm';
import Reports from './admin/Reports';
import StockManagement from './admin/stock/StockManagement';
import StockControlNew from './admin/StockControlNew';
import Login from './admin/Login';
import Settings from './admin/Settings';
import BannersList from './admin/banners/BannersList';
import BannerForm from './admin/banners/BannerForm';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';
import { initializeData } from './utils/initializeData';
import { authService } from './services/auth.service';
import { categoriesService } from './services/categories.service';
import { productsService } from './services/products.service';
import { Product, Category } from './types';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    initializeData();
    authService.initialize();
    const fetchedCategories = categoriesService.getAll().filter(c => c.visivel);
    setCategories(fetchedCategories);
    const fetchedProducts = productsService.getVisible();
    setAllProducts(fetchedProducts);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategory(categoryId);
    // Não fechar o sidebar aqui, a lógica de fechar está no SidebarCategoryItem
    // setSidebarOpen(false); 
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-white">
              <Navbar
                onMenuToggle={toggleSidebar}
                searchTerm={searchTerm}
                onSearchTermChange={handleSearchTermChange}
              />
              <CategoryNavbar
                categories={categories}
                onSelectCategory={handleSelectCategory}
                selectedCategoryId={selectedCategory}
              />
              {/* Adicionando o Sidebar aqui */}
              <Sidebar
                isOpen={sidebarOpen}
                onClose={toggleSidebar}
                categories={categories}
                onSelectCategory={handleSelectCategory}
                selectedCategoryId={selectedCategory}
              />
              <div className="pt-16 lg:pt-[120px]"> {/* Ajustar padding top: 72px (Navbar) + 48px (CategoryNavbar) = 120px */}
                <div className="px-4 pb-8 max-w-7xl mx-auto"> {/* Este div da SearchBar agora está vazio e pode ser removido se não houver outro conteúdo */}
                  {/* SearchBar foi movida para Navbar */}
                </div>
                <ProductCatalog
                  allProducts={allProducts}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  searchTerm={searchTerm}
                />
                <Benefits />
                <Footer />
              </div>
              <WhatsAppButton />
            </div>
          }
        />
        {/* Também adicionando o Sidebar à rota /carrinho */}
        <Route path="/carrinho" element={
          <div className="min-h-screen bg-white">
            <Navbar onMenuToggle={toggleSidebar} searchTerm={searchTerm} onSearchTermChange={handleSearchTermChange} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={toggleSidebar}
              categories={categories}
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategory}
            />
            <div className="pt-16">
              <CartPage />
            </div>
            <WhatsAppButton />
          </div>
        } />

        {/* Rota de Login para o painel administrativo */}
        <Route path="/admin/login" element={<Login />} />

        {/* Rotas do painel administrativo (protegidas) */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="produtos" element={<ProductsList />} />
          <Route path="produtos/novo" element={<ProductFormNew />} />
          <Route path="produtos/editar/:id" element={<ProductFormNew />} />
          <Route path="produtos/estoque/:id" element={<StockManagement />} />
          <Route path="estoque" element={<StockControlNew />} />
          <Route path="categorias" element={<CategoriesList />} />
          <Route path="categorias/novo" element={<CategoryForm />} />
          <Route path="categorias/editar/:id" element={<CategoryForm />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="banners" element={<BannersList />} />
          <Route path="banners/novo" element={<BannerForm />} />
          <Route path="banners/editar/:id" element={<BannerForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;