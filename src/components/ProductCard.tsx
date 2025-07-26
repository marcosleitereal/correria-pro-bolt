import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { StripeProduct } from '../stripe-config';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

interface ProductCardProps {
  product: StripeProduct;
  featured?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, featured = false }) => {
  const { createCheckoutSession, loading } = useStripeCheckout();

  const handlePurchase = async () => {
    const success_url = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${window.location.origin}/pricing`;

    await createCheckoutSession({
      price_id: product.priceId,
      mode: product.mode,
      success_url,
      cancel_url,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-2xl shadow-lg p-8 relative ${
        featured ? 'border-2 border-blue-500 scale-105' : 'border border-slate-200'
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Mais Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h3>
        <p className="text-slate-600 mb-6">{product.description}</p>
        
        <div className="mb-8">
          <span className="text-4xl font-bold text-slate-900">{product.price}</span>
          {product.mode === 'subscription' && (
            <span className="text-slate-600 ml-2">/mês</span>
          )}
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            featured
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 shadow-lg'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {product.mode === 'subscription' ? 'Assinar Agora' : 'Comprar Agora'}
        </button>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-slate-700">Acesso completo à plataforma</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-slate-700">Suporte técnico incluído</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-slate-700">Atualizações automáticas</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;