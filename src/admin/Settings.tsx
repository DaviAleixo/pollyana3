import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { shippingService } from '../services/shipping.service';
import CitySelectInput from '../components/CitySelectInput';
import { NumericFormat } from 'react-number-format';
import { showError, showSuccess } from '../utils/toast'; // Import toast utilities

export default function Settings() {
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Estados para as configurações de frete
  const [storeCity, setStoreCity] = useState('');
  const [localDeliveryCost, setLocalDeliveryCost] = useState(0);
  const [standardShippingCost, setStandardShippingCost] = useState(0);
  const [storePickupCost, setStorePickupCost] = useState(0);

  useEffect(() => {
    setCurrentUsername(authService.getUsername());
    
    // Carregar configurações de frete
    const loadConfig = async () => {
        const shippingConfig = await shippingService.getConfig();
        setStoreCity(shippingConfig.storeCity);
        setLocalDeliveryCost(shippingConfig.localDeliveryCost);
        setStandardShippingCost(shippingConfig.standardShippingCost);
        setStorePickupCost(shippingConfig.storePickupCost);
    };
    
    loadConfig();
  }, []);

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();

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
      showError(errorMessages.join(' '));
    } else if (successMessages.length > 0) {
      showSuccess(successMessages.join(' '));
    } else if (!changesMade) {
      showError('Nenhuma alteração foi feita. Preencha os campos que deseja atualizar.');
    }
  };

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeCity.trim()) {
      showError('A cidade da loja é obrigatória.');
      return;
    }
    if (localDeliveryCost < 0 || standardShippingCost < 0 || storePickupCost < 0) {
      showError('Os custos de frete não podem ser negativos.');
      return;
    }

    try {
        await shippingService.updateConfig({
            storeCity: storeCity.trim(),
            localDeliveryCost: localDeliveryCost,
            standardShippingCost: standardShippingCost,
            storePickupCost: storePickupCost,
        });
        showSuccess('Configurações de frete salvas com sucesso!');
    } catch (error) {
        console.error("Erro ao salvar configurações de frete:", error);
        showError('Erro ao salvar configurações de frete. Verifique o console.');
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