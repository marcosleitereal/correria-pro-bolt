# 🔧 CONFIGURAÇÃO CRÍTICA DO WEBHOOK PARA PRODUÇÃO

## 🚨 PROBLEMA IDENTIFICADO:
O webhook pode estar configurado com URLs incorretas ou variáveis de ambiente desatualizadas para produção.

## ✅ VERIFICAÇÕES OBRIGATÓRIAS:

### 1. **URL DO WEBHOOK NO STRIPE**
**Dashboard Stripe → Developers → Webhooks**

**URL CORRETA:** `https://correria.pro/.netlify/functions/stripe-webhook`

❌ **URLs INCORRETAS que podem estar configuradas:**
- `https://[preview-id].netlify.app/.netlify/functions/stripe-webhook`
- `https://localhost:3000/...`
- Qualquer URL que não seja `correria.pro`

### 2. **VARIÁVEIS DE AMBIENTE NO NETLIFY**
**Netlify Dashboard → Site Settings → Environment Variables**

**Verificar se estão corretas:**
```
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_)
STRIPE_WEBHOOK_SECRET=whsec_... (do webhook de produção)
```

### 3. **EVENTOS DO WEBHOOK**
**Eventos obrigatórios:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### 4. **TESTE DA FUNÇÃO**
**URL para testar:** `https://correria.pro/.netlify/functions/stripe-webhook`

**Resultado esperado:** `{"error":"Método não permitido"}`
**❌ Se retornar 404:** Função não foi deployada

## 🔧 PASSOS PARA CORREÇÃO:

### **Passo 1: Atualizar URL no Stripe**
1. Acesse: https://dashboard.stripe.com/webhooks
2. Encontre seu webhook
3. Clique em "Edit" (Editar)
4. Altere a URL para: `https://correria.pro/.netlify/functions/stripe-webhook`
5. Salve as alterações

### **Passo 2: Verificar Webhook Secret**
1. No mesmo webhook, vá para "Signing secret"
2. Clique em "Reveal"
3. Copie o valor
4. No Netlify, atualize `STRIPE_WEBHOOK_SECRET` com este valor

### **Passo 3: Testar Novamente**
1. Faça um novo pagamento de teste
2. Verifique os logs da função no Netlify
3. Confirme se o usuário foi ativado automaticamente

## 🎯 TESTE RÁPIDO:

**Para o usuário `3dia@teste.com`:**
1. Fazer logout/login (ativa detecção automática)
2. OU fazer novo pagamento
3. OU usar ativação manual no Admin

## 📞 SUPORTE:

Se ainda não funcionar após essas correções:
1. Verificar logs detalhados da função Netlify
2. Confirmar se o Stripe está enviando eventos para a URL correta
3. Validar se todas as variáveis de ambiente estão corretas

**O webhook DEVE funcionar com essas correções!**