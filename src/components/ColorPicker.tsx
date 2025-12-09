import React from 'react';

interface ColorPickerProps {
  value: string; // Hex color string, e.g., '#RRGGBB'
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label, className }) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0 border-none cursor-pointer"
          style={{ backgroundColor: value }} // Show the color in the input itself
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-2 focus:outline-none focus:border-black text-sm"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  );
};

export default ColorPicker;