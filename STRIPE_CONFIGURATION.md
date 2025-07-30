# 🔧 CONFIGURAÇÃO OBRIGATÓRIA DO STRIPE

## 📍 ONDE CONFIGURAR AS URLs:

### 1. **WEBHOOK URL** (CRÍTICO para ativação automática)
**Local:** Dashboard Stripe → Developers → Webhooks

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. **URL do endpoint:** `https://correria.pro/.netlify/functions/stripe-webhook`
4. **Eventos para escutar:**
   - `checkout.session.completed` ✅
   - `customer.subscription.created` ✅
   - `customer.subscription.updated` ✅
   - `customer.subscription.deleted` ✅
   - `invoice.payment_succeeded` ✅
   - `invoice.payment_failed` ✅

### 2. **SUCCESS/CANCEL URLs** (Para cada produto)
**Local:** Dashboard Stripe → Products → [Seu Produto] → Pricing

Para cada **Price** que você criou:

1. Acesse: https://dashboard.stripe.com/products
2. Clique no seu produto
3. Clique no preço (Price)
4. Em "Payment links" ou ao criar checkout sessions

**OU configure diretamente no código** (já está configurado):

```javascript
// No arquivo: src/hooks/useCheckout.ts
const success_url = `https://correria.pro/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
const cancel_url = `https://correria.pro/pricing`;
```

## 🚨 VERIFICAÇÃO CRÍTICA:

### Verifique se o webhook está funcionando:
1. **Faça um pagamento teste**
2. **Vá em:** Dashboard Stripe → Developers → Webhooks → [Seu webhook]
3. **Clique em "Logs"**
4. **Deve aparecer eventos** como `checkout.session.completed`
5. **Status deve ser:** `200 OK` (sucesso)

### Se aparecer erro 404 ou 500:
- ❌ URL do webhook está errada
- ❌ Função não foi deployada corretamente
- ❌ Netlify não está processando a função

## 🎯 URLs FINAIS PARA COPIAR:

```
Webhook URL: https://correria.pro/.netlify/functions/stripe-webhook
Success URL: https://correria.pro/checkout/success?session_id={CHECKOUT_SESSION_ID}
Cancel URL: https://correria.pro/pricing
```

## 🔍 TESTE RÁPIDO:

Após configurar, teste acessando diretamente:
- https://correria.pro/.netlify/functions/stripe-webhook

**Deve retornar:** `{"error":"Método não permitido"}` (isso é NORMAL - significa que a função existe)

**Se retornar 404:** A função não foi deployada corretamente.