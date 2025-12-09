import { Instagram, Phone } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl md:text-3xl font-bold mb-3 tracking-wide">
              Pollyana Basic Chic
            </h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Moda feminina com estilo, qualidade e precos acessiveis.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <a
              href="https://instagram.com/pollyana.bc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
            >
              <Instagram className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm">@pollyana.bc</span>
            </a>
            <a
              href="https://wa.me/5531983921200"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
            >
              <Phone className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm">(31) 9 8392-1200</span>
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/50 text-sm">
              {currentYear} Pollyana Basic Chic. Todos os direitos reservados.
            </p>
            <p className="text-white/40 text-xs">
              Desenvolvido por{' '}
              <a
                href="https://instagram.com/davialeixo_nogueira"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors duration-200 underline underline-offset-2"
              >
                Davi Aleixo
              </a>
              {' | '}
              <a
                href="https://wa.me/5531982607426"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors duration-200 underline underline-offset-2"
              >
                31 9 8260-7426
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}