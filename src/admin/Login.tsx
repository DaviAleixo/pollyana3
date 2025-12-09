import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authService.login(username, password)) {
      navigate('/admin', { replace: true }); // Redireciona para o dashboard após o login
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white p-8 shadow-lg w-full max-w-md border border-gray-200">
        <h1 className="font-serif text-3xl font-bold text-black mb-6 text-center">
          Login Administrativo
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Acesse o painel de controle da Pollyana Basic Chic
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-black"
              placeholder="admin123"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors font-medium"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}