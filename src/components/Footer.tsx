import { Instagram, Facebook, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Grid de informações do rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo e descrição */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl font-bold mb-3 tracking-wide">
              Pollyana Basic Chic
            </h3>
            <p className="text-white/70 text-sm font-light leading-relaxed">
              Moda básica, moderna e atemporal para mulheres reais.
            </p>
          </div>

          {/* Links úteis */}
          <div className="text-center">
            <h4 className="font-semibold mb-3 text-lg">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Política de Trocas
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>

          {/* Redes sociais */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold mb-3 text-lg">Siga-nos</h4>
            <div className="flex justify-center md:justify-end gap-4">
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full" // Ícones arredondados
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-white/10 pt-6 text-center text-sm text-white/60">
          <p>
            © {currentYear} Pollyana Basic Chic. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}