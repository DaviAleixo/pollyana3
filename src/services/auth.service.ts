// Serviço de autenticação
// Gerencia login, logout e status de autenticação

const ADMIN_TOKEN_KEY = 'adminLoggedIn';
const ADMIN_USERNAME_KEY = 'adminUsername';
const ADMIN_PASSWORD_KEY = 'adminPassword';

class AuthService {
  // Inicializa as credenciais padrão se não existirem
  initialize(): void {
    if (!localStorage.getItem(ADMIN_USERNAME_KEY)) {
      localStorage.setItem(ADMIN_USERNAME_KEY, 'admin');
    }
    if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, 'admin123');
    }
  }

  // Realiza o login com credenciais armazenadas
  login(username: string, password: string): boolean {
    const storedUsername = localStorage.getItem(ADMIN_USERNAME_KEY);
    const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);

    if (username === storedUsername && password === storedPassword) {
      localStorage.setItem(ADMIN_TOKEN_KEY, 'true');
      return true;
    }
    return false;
  }

  // Realiza o logout
  logout(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  // Verifica se o usuário está autenticado
  isAuthenticated(): boolean {
    return localStorage.getItem(ADMIN_TOKEN_KEY) === 'true';
  }

  // Obtém o nome de usuário atual
  getUsername(): string {
    return localStorage.getItem(ADMIN_USERNAME_KEY) || 'admin';
  }

  // Atualiza o nome de usuário
  setUsername(newUsername: string): void {
    localStorage.setItem(ADMIN_USERNAME_KEY, newUsername);
  }

  // Atualiza a senha
  setPassword(newPassword: string): void {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  }
}

export const authService = new AuthService();