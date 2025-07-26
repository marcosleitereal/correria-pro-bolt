export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SWSP0h0V8dHgoH',
    priceId: 'price_1RbPUPBnjFk91bSiqDgyZW9j',
    name: 'Software',
    description: 'Acesso completo à plataforma Correria.Pro com todas as funcionalidades para treinadores de corrida.',
    mode: 'payment',
    price: 'R$ 10,00'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};