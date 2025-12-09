import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, MapPin, CheckCircle } from 'lucide-react';

interface City {
  id: number;
  nome: string;
}

interface CitySelectInputProps {
  label: string;
  initialCity: string;
  onSelectCity: (cityName: string) => void;
  className?: string;
}

const CitySelectInput: React.FC<CitySelectInputProps> = ({ label, initialCity, onSelectCity, className }) => {
  const [allCities, setAllCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch cities from IBGE API
  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
        const data: City[] = await response.json();
        // Sort cities alphabetically
        const sortedCities = data.sort((a, b) => a.nome.localeCompare(b.nome));
        setAllCities(sortedCities);
      } catch (error) {
        console.error('Error fetching cities from IBGE:', error);
        // You might want to show a user-friendly error message here
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Filter cities based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities([]);
      return;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = allCities.filter(city =>
      city.nome.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredCities(results.slice(0, 100)); // Limit results for performance
  }, [searchTerm, allCities]);

  // Set initial search term to initialCity
  useEffect(() => {
    setSearchTerm(initialCity);
  }, [initialCity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true); // Open dropdown when typing
    // If the user starts typing, the previously selected city might no longer be valid
    // We can clear the parent's selected city until a new one is chosen
    if (allCities.some(c => c.nome === initialCity) && e.target.value !== initialCity) {
        onSelectCity('');
    }
  };

  const handleSelectCity = (city: City) => {
    setSearchTerm(city.nome);
    onSelectCity(city.nome);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      // If user clicks outside and the current search term is not a valid city,
      // revert to the last valid selected city (initialCity)
      if (!allCities.some(c => c.nome === searchTerm) && initialCity) {
        setSearchTerm(initialCity);
        onSelectCity(initialCity);
      } else if (!allCities.some(c => c.nome === searchTerm) && !initialCity) {
        // If no initial city and current search term is invalid, clear it
        setSearchTerm('');
        onSelectCity('');
      }
    }
  }, [allCities, initialCity, searchTerm, onSelectCity]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const isCitySelected = allCities.some(c => c.nome === searchTerm);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:border-black rounded-md"
          placeholder="Digite o nome da cidade"
          aria-label={label}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
        {!loading && searchTerm && isCitySelected && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
        )}
        {!loading && searchTerm && !isCitySelected && (
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
      </div>

      {isOpen && filteredCities.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg rounded-md">
          {filteredCities.map(city => (
            <li
              key={city.id}
              onClick={() => handleSelectCity(city)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              {city.nome}
            </li>
          ))}
        </ul>
      )}
      {isOpen && searchTerm.trim() !== '' && filteredCities.length === 0 && !loading && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 p-2 text-sm text-gray-500 rounded-md shadow-lg">
          Nenhuma cidade encontrada.
        </div>
      )}
    </div>
  );
};

export default CitySelectInput;