# 🚨 DEBUG CRÍTICO DO WEBHOOK - ATIVAÇÃO AUTOMÁTICA

## 🎯 PROBLEMA:
**Usuário paga mas não é ativado automaticamente**

### **SINTOMAS:**
- ✅ Pagamento processado com sucesso
- ✅ Página de sucesso mostrada  
- ❌ Usuário continua "Restrito"
- ❌ Plano não é atribuído

---

## 🔍 DIAGNÓSTICO OBRIGATÓRIO:

### **1. TESTAR FUNÇÃO WEBHOOK**
**URL:** `https://correria.pro/.netlify/functions/stripe-webhook`

**RESULTADOS POSSÍVEIS:**
- ✅ **405 "Método não permitido"** = Função OK
- ❌ **404 "Not Found"** = Função não deployada
- ❌ **502 "Bad Gateway"** = Função falha internamente
- ❌ **500 "Internal Error"** = Erro de variáveis/código

### **2. VERIFICAR WEBHOOK NO STRIPE**
**Dashboard:** https://dashboard.stripe.com/webhooks

**VERIFICAR:**
- ✅ URL: `https://correria.pro/.netlify/functions/stripe-webhook`
- ✅ Status: **Enabled**
- ✅ Eventos: `checkout.session.completed`
- ✅ Logs: Deve mostrar tentativas de envio

### **3. VARIÁVEIS DE AMBIENTE NETLIFY**
**Localização:** Site Settings → Environment Variables

**OBRIGATÓRIAS:**
```
VITE_SUPABASE_URL=https://[projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role)
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚨 CAUSAS MAIS PROVÁVEIS:

### **CAUSA 1: Webhook não configurado no Stripe**
- **Sintoma:** Função responde 405, mas não há logs no Stripe
- **Solução:** Configurar webhook no Stripe

### **CAUSA 2: URL errada no Stripe**
- **Sintoma:** Stripe mostra erro 404 nos logs
- **Solução:** Corrigir URL para `https://correria.pro/.netlify/functions/stripe-webhook`

### **CAUSA 3: Função não deployada**
- **Sintoma:** URL retorna 404
- **Solução:** Redeploy da aplicação

### **CAUSA 4: Variáveis de ambiente erradas**
- **Sintoma:** Função retorna 500/502
- **Solução:** Verificar e corrigir variáveis no Netlify

---

## ⚡ TESTE RÁPIDO:

### **Para `2dia@teste.com`:**
1. **Fazer novo pagamento**
2. **Verificar logs** da função no Netlify
3. **Verificar logs** do webhook no Stripe
4. **Se falhar:** Usar diagnóstico no Admin

---

## 🎯 OBJETIVO:
**ATIVAÇÃO 100% AUTOMÁTICA SEM INTERVENÇÃO MANUAL**

**O webhook DEVE funcionar para produção!**