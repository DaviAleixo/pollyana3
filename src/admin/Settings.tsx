import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { shippingService } from '../services/shipping.service';
import { Upload, X } from 'lucide-react';
import CitySelectInput from '../components/CitySelectInput';
import { NumericFormat } from 'react-number-format';
import { storageService, STORAGE_KEYS } from '../services/storage.service';
import { resizeImage, validateFileSize, validateFileType } from '../utils/imageUtils';
import defaultLogoImage from '/attached_assets/WhatsApp_Image_2025-11-25_at_15.53.40-removebg-preview_1765314447113.png';

export default function Settings() {
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados para as configurações de frete
  const [storeCity, setStoreCity] = useState('');
  const [localDeliveryCost, setLocalDeliveryCost] = useState(0);
  const [standardShippingCost, setStandardShippingCost] = useState(0);
  const [storePickupCost, setStorePickupCost] = useState(0);
  const [shippingMessage, setShippingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados para a Logo
  const [logoUrl, setLogoUrl] = useState(defaultLogoImage);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoMessage, setLogoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  useEffect(() => {
    setCurrentUsername(authService.getUsername());
    
    // Carregar configurações de frete
    const loadConfig = async () => {
        const config = await shippingService.getConfig();
        setStoreCity(config.storeCity);
        setLocalDeliveryCost(config.localDeliveryCost);
        setStandardShippingCost(config.standardShippingCost);
        setStorePickupCost(config.storePickupCost);
    };
    
    // Carregar logo
    const loadLogo = () => {
        const customLogo = storageService.get<string>(STORAGE_KEYS.CUSTOM_LOGO_URL);
        setLogoUrl(customLogo || defaultLogoImage);
    };

    loadConfig();
    loadLogo();
  }, []);

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    let changesMade = false;
    let successMessages: string[] = [];
    let errorMessages: string[] = [];

    // 1. Tenta atualizar o nome de usuário (Opcional)
    if (newUsername.trim() !== '') {
      if (newUsername.trim() !== currentUsername) {
        authService.setUsername(newUsername.trim());
        setCurrentUsername(newUsername.trim());
        setNewUsername('');
        successMessages.push('Usuário atualizado com sucesso!');
        changesMade = true;
      } else {
        errorMessages.push('O novo usuário é igual ao atual.');
      }
    }

    // 2. Tenta atualizar a senha (Obrigatório se preenchida)
    const passwordFieldsFilled = newPassword.trim() !== '' || confirmNewPassword.trim() !== '';

    if (passwordFieldsFilled) {
      if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
        errorMessages.push('Nova senha e Confirmação de Senha são obrigatórias para alterar a senha.');
      } else if (newPassword !== confirmNewPassword) {
        errorMessages.push('A nova senha e a confirmação não coincidem.');
      } else {
        authService.setPassword(newPassword);
        setNewPassword('');
        setConfirmNewPassword('');
        successMessages.push('Senha atualizada com sucesso!');
        changesMade = true;
      }
    }

    if (errorMessages.length > 0) {
      setMessage({ type: 'error', text: errorMessages.join(' ') });
    } else if (successMessages.length > 0) {
      setMessage({ type: 'success', text: successMessages.join(' ') });
    } else if (!changesMade) {
      setMessage({ type: 'error', text: 'Nenhuma alteração foi feita. Preencha os campos que deseja atualizar.' });
    }
  };

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingMessage(null);

    if (!storeCity.trim()) {
      setShippingMessage({ type: 'error', text: 'A cidade da loja é obrigatória.' });
      return;
    }
    if (localDeliveryCost < 0 || standardShippingCost < 0 || storePickupCost < 0) {
      setShippingMessage({ type: 'error', text: 'Os custos de frete não podem ser negativos.' });
      return;
    }

    try {
        await shippingService.updateConfig({
            storeCity: storeCity.trim(),
            localDeliveryCost: localDeliveryCost,
            standardShippingCost: standardShippingCost,
            storePickupCost: storePickupCost,
        });
        setShippingMessage({ type: 'success', text: 'Configurações de frete salvas com sucesso!' });
    } catch (error) {
        console.error("Erro ao salvar configurações de frete:", error);
        setShippingMessage({ type: 'error', text: 'Erro ao salvar configurações de frete. Verifique o console.' });
    }
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      setLogoMessage({ type: 'error', text: 'Tipo de arquivo inválido. Use JPG, PNG ou WEBP.' });
      return;
    }

    if (!validateFileSize(file, 2)) { // Limite de 2MB para logo
      setLogoMessage({ type: 'error', text: 'Arquivo muito grande. Tamanho máximo: 2MB' });
      return;
    }

    setLogoUploadLoading(true);
    setLogoMessage(null);
    try {
      // Redimensionar para um tamanho razoável para logo (ex: 400x400)
      const resizedImage = await resizeImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.9,
      });
      
      storageService.set(STORAGE_KEYS.CUSTOM_LOGO_URL, resizedImage);
      setLogoUrl(resizedImage);
      setLogoMessage({ type: 'success', text: 'Logo atualizada com sucesso!' });
      window.dispatchEvent(new Event('storage')); // Notificar Navbar
    } catch (error) {
      console.error('Erro ao processar imagem da logo:', error);
      setLogoMessage({ type: 'error', text: 'Erro ao processar imagem da logo.' });
    } finally {
      setLogoUploadLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Deseja remover a logo personalizada e voltar para a logo padrão?')) {
      storageService.remove(STORAGE_KEYS.CUSTOM_LOGO_URL);
      setLogoUrl(defaultLogoImage);
      setLogoMessage({ type: 'success', text: 'Logo removida. Usando logo padrão.' });
      window.dispatchEvent(new Event('storage')); // Notificar Navbar
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Configurações</h1>
        <p className="text-gray-600">
          Gerencie as credenciais de acesso e as configurações gerais da loja.
        </p>
      </div>
      
      {/* Seção de Logo da Loja */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Logo da Loja</h2>
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <img
                    src={logoUrl}
                    alt="Logo Atual"
                    className="h-20 w-auto object-contain border border-gray-200 p-2"
                />
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 bg-black text-white px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        {logoUploadLoading ? 'Processando...' : 'Fazer Upload da Logo'}
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={logoUploadLoading}
                        />
                    </label>
                    {logoUrl !== defaultLogoImage && (
                        <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm w-fit"
                        >
                            <X className="w-4 h-4" />
                            Remover Logo Personalizada
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-500">
                Recomendado: Imagem quadrada ou retangular com fundo transparente (PNG). Máx 2MB.
            </p>
        </div>
        {logoMessage && (
          <div
            className={`mt-4 p-3 text-sm ${
              logoMessage.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
            role="alert"
          >
            {logoMessage.text}
          </div>
        )}
      </div>

      {/* Seção de Credenciais */}
      <form onSubmit={handleSubmitAuth} className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Credenciais de Acesso</h2>
        <div className="space-y-6">
          {/* Usuário Atual */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuário Atual
            </label>
            <input
              type="text"
              value={currentUsername}
              className="w-full border border-gray-300 px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Novo Usuário (Opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Novo Nome de Usuário (opcional)
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="Deixe em branco para não alterar o nome de usuário"
            />
          </div>

          {/* Nova Senha (Opcional, mas exige confirmação) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nova Senha (Preencha ambos os campos para alterar)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="Nova senha"
            />
          </div>

          {/* Confirmar Nova Senha (Opcional, mas exige confirmação) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="Confirme a nova senha"
            />
          </div>
        </div>

        {message && (
          <div
            className={`mt-6 p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            Salvar Credenciais
          </button>
        </div>
      </form>

      {/* Seção de Configurações de Frete */}
      <form onSubmit={handleSubmitShipping} className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-4">Configurações de Frete</h2>
        <div className="space-y-6">
          {/* Campo de seleção de cidade da loja com autocomplete */}
          <CitySelectInput
            label="Cidade da Loja *"
            initialCity={storeCity}
            onSelectCity={setStoreCity}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custo de Entrega Local (R$) *
            </label>
            <NumericFormat
              value={localDeliveryCost}
              onValueChange={(values) => setLocalDeliveryCost(values.floatValue || 0)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custo de Frete Padrão (R$) *
            </label>
            <NumericFormat
              value={standardShippingCost}
              onValueChange={(values) => setStandardShippingCost(values.floatValue || 0)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            />
          </div>
          {/* Novo campo para custo de retirada na loja */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custo de Retirada na Loja (R$) *
            </label>
            <NumericFormat
              value={storePickupCost}
              onValueChange={(values) => setStorePickupCost(values.floatValue || 0)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              required
            />
          </div>
        </div>

        {shippingMessage && (
          <div
            className={`mt-6 p-3 text-sm ${
              shippingMessage.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
            role="alert"
          >
            {shippingMessage.text}
          </div>
        )}

        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            Salvar Configurações de Frete
          </button>
        </div>
      </form>
    </div>
  );
}