# ✅ CHECKLIST COMPLETO - WEBHOOK STRIPE

## 🎯 OBJETIVO: ATIVAÇÃO 100% AUTOMÁTICA

### **1. VERIFICAÇÃO DA FUNÇÃO NETLIFY**

#### **Teste da URL:**
```bash
curl https://correria.pro/.netlify/functions/stripe-webhook
```

**✅ RESULTADO ESPERADO:** `{"error":"Método não permitido"}`
**❌ ERRO 502:** Função com problema interno

#### **Verificação no Netlify:**
1. Acesse: https://app.netlify.com/sites/[SEU_SITE]/functions
2. Procure por: `stripe-webhook`
3. Status deve ser: **Deployed** (não Failed)

### **2. VARIÁVEIS DE AMBIENTE NO NETLIFY**

#### **Localização:** Site Settings → Environment Variables

#### **Variáveis Obrigatórias:**
```
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Como Obter:**

**STRIPE_SECRET_KEY:**
- Dashboard Stripe → Developers → API Keys
- Copiar "Secret key"

**STRIPE_WEBHOOK_SECRET:**
- Dashboard Stripe → Developers → Webhooks
- Clicar no seu webhook → "Signing secret" → Reveal

**SUPABASE_SERVICE_ROLE_KEY:**
- Supabase Dashboard → Settings → API
- Copiar "service_role" (não anon)

### **3. CONFIGURAÇÃO DO WEBHOOK NO STRIPE**

#### **URL do Endpoint:**
```
https://correria.pro/.netlify/functions/stripe-webhook
```

#### **Eventos Obrigatórios:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

#### **Verificação:**
1. Dashboard Stripe → Developers → Webhooks
2. Encontrar webhook com URL acima
3. Status deve ser: **Enabled**

### **4. TESTE DE PAGAMENTO**

#### **Procedimento:**
1. **Criar conta nova** (ex: teste@exemplo.com)
2. **Fazer pagamento** completo via Stripe
3. **Aguardar 30 segundos** para webhook processar
4. **Fazer login** e verificar ativação

#### **Verificação de Sucesso:**
- ✅ Usuário logado sem bloqueio
- ✅ Status: "Plano Ativo" (não "Trial Expirado")
- ✅ Acesso a todas as funcionalidades

### **5. MONITORAMENTO DE LOGS**

#### **Logs da Função Netlify:**
1. Netlify Dashboard → Functions → stripe-webhook
2. Verificar logs após pagamento
3. Procurar por: "✅ WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!"

#### **Logs do Stripe:**
1. Dashboard Stripe → Developers → Webhooks
2. Clicar no webhook → Logs
3. Status deve ser: **200 OK** (não 4xx ou 5xx)

### **6. VERIFICAÇÃO NO SUPABASE**

#### **Tabela subscriptions:**
```sql
SELECT user_id, status, trial_ends_at, current_plan_name 
FROM user_subscription_details 
WHERE email = 'email_do_teste@exemplo.com';
```

**✅ RESULTADO ESPERADO:**
- `status`: 'active'
- `trial_ends_at`: null
- `has_access`: true

### **7. TROUBLESHOOTING**

#### **Se Erro 502 Persistir:**
- ❌ Variável de ambiente ausente
- ❌ Código da função com erro
- ❌ Timeout na execução

#### **Se Webhook Não For Chamado:**
- ❌ URL incorreta no Stripe
- ❌ Eventos não configurados
- ❌ Webhook desabilitado

#### **Se Usuário Não For Ativado:**
- ❌ Erro na lógica de ativação
- ❌ Problema de conectividade com Supabase
- ❌ Customer não encontrado na base

### **8. VALIDAÇÃO FINAL**

#### **Critérios de Sucesso:**
- ✅ Função webhook responde corretamente
- ✅ Variáveis de ambiente configuradas
- ✅ Webhook configurado no Stripe
- ✅ Pagamento de teste ativa usuário automaticamente
- ✅ Logs mostram ativação bem-sucedida
- ✅ Usuário acessa sistema sem bloqueio

**🎯 META: ATIVAÇÃO 100% AUTOMÁTICA PARA PRODUÇÃO!**