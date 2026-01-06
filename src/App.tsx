import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import ProductCatalog from './components/ProductCatalog';
import Benefits from './components/Benefits';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CategoryNavbar from './components/CategoryNavbar';
import CartPage from './pages/CartPage';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ProductsList from './admin/products/ProductsList';
import ProductFormNew from './admin/products/ProductFormNew';
import CategoriesList from './admin/categories/CategoriesList';
import CategoryForm from './admin/categories/CategoryForm';
import Reports from './admin/Reports';
// import StockManagement from './admin/stock/StockManagement'; // REMOVIDO
import StockControlNew from './admin/StockControlNew';
import Login from './admin/Login';
import Settings from './admin/Settings';
import BannersList from './admin/banners/BannersList';
import BannerForm from './admin/banners/BannerForm';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';
import MobileFilterDrawer from './components/MobileFilterDrawer';
import { initializeData } from './utils/initializeData';
import { authService } from './services/auth.service';
import { categoriesService } from './services/categories.service';
import { productsService } from './services/products.service';
import { Product, Category, SortOption } from './types'; // Import SortOption

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false); // NEW STATE
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('default'); // NEW STATE

  const loadInitialData = useCallback(async () => {
    await initializeData();
    authService.initialize();
    const fetchedCategories = await categoriesService.getAll();
    setCategories(fetchedCategories.filter(c => c.visivel));
    const fetchedProducts = await productsService.getVisible();
    setAllProducts(fetchedProducts);
  }, []);

  useEffect(() => {
    loadInitialData();
    
    // Adiciona listener para recarregar dados quando o storage muda (útil após salvar no admin)
    window.addEventListener('storage', loadInitialData);
    return () => window.removeEventListener('storage', loadInitialData);
  }, [loadInitialData]);

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
                onFilterToggle={() => setMobileFilterOpen(true)} // NEW PROP
              />
              <CategoryNavbar
                categories={categories}
                onSelectCategory={handleSelectCategory}
                selectedCategoryId={selectedCategory}
              />
              <Sidebar
                isOpen={sidebarOpen}
                onClose={toggleSidebar}
                categories={categories}
                onSelectCategory={handleSelectCategory}
                selectedCategoryId={selectedCategory}
              />
              
              {/* Mobile Filter Drawer */}
              <MobileFilterDrawer
                isOpen={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
                sortOption={sortOption}
                onSortChange={setSortOption}
              />
              
              <div className="pt-[160px] lg:pt-[124px]"> {/* Ajustado padding superior para 160px (mobile) para dar mais espaço */}
                
                <ProductCatalog
                  allProducts={allProducts}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory} {/* PASSANDO O HANDLER */}
                  searchTerm={searchTerm}
                  sortOption={sortOption} // PASS DOWN
                  onSortChange={setSortOption} // PASS DOWN
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
            <Navbar 
              onMenuToggle={toggleSidebar} 
              searchTerm={searchTerm} 
              onSearchTermChange={handleSearchTermChange} 
              onFilterToggle={() => setMobileFilterOpen(true)} // NEW PROP
            />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={toggleSidebar}
              categories={categories}
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategory}
            />
            <div className="pt-[104px] lg:pt-16"> {/* Mantido o padding do carrinho */}
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
          {/* <Route path="produtos/estoque/:id" element={<StockManagement />} /> REMOVIDO */}
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