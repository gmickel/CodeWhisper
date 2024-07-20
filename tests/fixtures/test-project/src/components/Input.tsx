import type React from 'react';
export const Input: React.FC<{ placeholder: string }> = ({ placeholder }) => (
  <input placeholder={placeholder} />
);
