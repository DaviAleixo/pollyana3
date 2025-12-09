import React from 'react';

interface SectionTitleProps {
  title: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, className }) => {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-black pb-4 inline-block relative">
        {title}
        <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 h-1 w-1/3 bg-black opacity-70 rounded-full"></span>
      </h2>
    </div>
  );
};

export default SectionTitle;