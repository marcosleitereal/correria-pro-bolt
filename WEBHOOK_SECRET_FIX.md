# 🚨 CORREÇÃO CRÍTICA - STRIPE WEBHOOK SECRET

## 🎯 PROBLEMA IDENTIFICADO:
**"No signatures found matching the expected signature for payload"**

Isso significa que o `STRIPE_WEBHOOK_SECRET` está incorreto ou ausente no Netlify.

## 🔧 SOLUÇÃO IMEDIATA:

### **1. OBTER O WEBHOOK SECRET CORRETO**

**Acesse:** https://dashboard.stripe.com/webhooks

**Passos:**
1. **Encontre seu webhook:** `https://correria.pro/.netlify/functions/stripe-webhook`
2. **Clique no webhook**
3. **Seção "Signing secret"** → **"Click to reveal"**
4. **Copie o valor** (começa com `whsec_`)

### **2. ADICIONAR NO NETLIFY**

**Acesse:** https://app.netlify.com/sites/correria-pro/settings/env

**Adicione/Atualize:**
```
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### **3. VERIFICAR OUTRAS VARIÁVEIS**

**Certifique-se que tem todas:**
```
VITE_SUPABASE_URL=https://sonniksolutionstec.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (ESTA ESTAVA FALTANDO/INCORRETA)
```

### **4. APÓS ADICIONAR:**
1. **Redeploy automático** do Netlify
2. **Fazer novo pagamento** de teste
3. **Webhook deve funcionar** sem erro de assinatura

## 🎯 RESULTADO ESPERADO:
**Ativação automática funcionando 100%!**

---

**ESTA É A ÚLTIMA PEÇA DO QUEBRA-CABEÇA!**