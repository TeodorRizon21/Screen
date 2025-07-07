import { useState, useEffect } from 'react';

interface UseShippingPrice {
  shippingPrice: number;
  isLoading: boolean;
  error: string | null;
  currency: string;
  vat: number;
  calculateShipping: (params: {
    city: string;
    county: string;
    postalCode: string;
    totalWeight: number;
  }) => Promise<void>;
}

export function useShippingPrice(): UseShippingPrice {
  const [shippingPrice] = useState(15);
  const [currency] = useState('RON');
  const [vat] = useState(0);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const calculateShipping = async () => {
    // Nu mai facem niciun calcul, returnăm mereu 15 RON
    return;
  };

  return {
    shippingPrice,
    currency,
    vat,
    isLoading,
    error,
    calculateShipping,
  };
} 