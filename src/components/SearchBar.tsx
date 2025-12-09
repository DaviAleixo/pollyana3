import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearchTermChange: (term: string) => void;
  initialSearchTerm?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchTermChange, initialSearchTerm = '', className }) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);

  // Sincroniza o estado interno com o prop inicial, útil para resetar a busca
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Reporta o termo de busca ao componente pai sempre que ele muda
  useEffect(() => {
    onSearchTermChange(searchTerm);
  }, [searchTerm, onSearchTermChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`relative max-w-xl mx-auto ${className}`}>
      <input
        type="text"
        placeholder="Buscar produtos por nome, categoria ou descrição..."
        value={searchTerm}
        onChange={handleChange}
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black shadow-sm transition-all"
        aria-label="Buscar produtos"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    </div>
  );
};

export default SearchBar;