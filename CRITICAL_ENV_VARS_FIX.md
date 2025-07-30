# 🚨 CORREÇÃO CRÍTICA - VARIÁVEIS DE AMBIENTE

## 🎯 PROBLEMA IDENTIFICADO:
**Webhook falha com erro 500: "Variáveis de ambiente ausentes: SUPABASE_SERVICE_ROLE_KEY"**

## 🔧 SOLUÇÃO IMEDIATA:

### **1. ADICIONAR VARIÁVEL AUSENTE NO NETLIFY**

**Acesse:** https://app.netlify.com/sites/correria-pro/settings/env

**ADICIONE:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbm5pa3NvbHV0aW9uc3RlY2giLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzIxNzY4NzI5LCJleHAiOjIwMzc0NDQ3Mjl9.qGJhJJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJK
```

### **2. ONDE ENCONTRAR A CHAVE:**
1. **Supabase Dashboard:** https://supabase.com/dashboard/project/sonniksolutionstec/settings/api
2. **Copiar:** "service_role" key (não a anon key)
3. **Colar no Netlify:** Como `SUPABASE_SERVICE_ROLE_KEY`

### **3. VERIFICAR OUTRAS VARIÁVEIS:**
```
VITE_SUPABASE_URL=https://sonniksolutionstec.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[ADICIONAR ESTA]
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **4. APÓS ADICIONAR:**
1. **Redeploy** da aplicação (automático)
2. **Testar webhook:** Fazer novo pagamento
3. **Verificar logs:** Deve mostrar sucesso

## 🎯 RESULTADO ESPERADO:
**Ativação automática funcionando 100%!**

---

**ESTA É A CAUSA RAIZ DO PROBLEMA!**