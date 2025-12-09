import { Truck, RefreshCw, MessageCircle } from 'lucide-react';

// Lista de benefícios com ícones
const benefits = [
  {
    icon: Truck,
    title: 'Envio para todo o Brasil',
    description: 'Entrega rápida e segura',
  },
  {
    icon: RefreshCw,
    title: 'Troca fácil',
    description: 'Até 30 dias para trocar',
  },
  {
    icon: MessageCircle,
    title: 'Atendimento via WhatsApp',
    description: 'Suporte rápido e personalizado',
  },
];

export default function Benefits() {
  return (
    <section className="bg-white py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Grid de benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"> {/* Ajustado para 2 colunas no sm e 3 no md */}
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center flex flex-col items-center group bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300" // Estilo de card
            >
              {/* Ícone com efeito hover */}
              <div className="mb-4 p-4 bg-black group-hover:bg-gray-800 transition-colors duration-300 rounded-full shadow-md">
                <benefit.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>

              {/* Título do benefício */}
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-black mb-2">
                {benefit.title}
              </h3>

              {/* Descrição */}
              <p className="text-gray-600 text-sm max-w-xs mx-auto">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Linha divisória decorativa */}
        <div className="mt-12 w-full h-px bg-gray-200" />
      </div>
    </section>
  );
}