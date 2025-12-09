import React from 'react';

interface SectionTitleProps {
  title: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, className }) => {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-black mb-2 inline-block relative">
        {title}
        {/* Sublinhado moderno e elegante */}
        <span className="absolute left-1/2 transform -translate-x-1/2 bottom-0 h-1 w-1/3 bg-black opacity-70"></span>
      </h2>
    </div>
  );
};

export default SectionTitle;