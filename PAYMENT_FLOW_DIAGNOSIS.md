# 🔍 DIAGNÓSTICO COMPLETO DO FLUXO DE PAGAMENTO - CORRERIA.PRO

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO:

**ERRO 502 "Bad Gateway"** na função webhook do Stripe significa que:
- ✅ A função existe no Netlify
- ❌ A função está falhando internamente
- ❌ Usuários não são ativados automaticamente após pagamento

## 📊 ANÁLISE DO FLUXO ATUAL:

### 1. **CHECKOUT FLOW** ✅ (Funcionando)
```
Usuário → Página de Preços → Stripe Checkout → Pagamento → ???
```

### 2. **WEBHOOK FLOW** ❌ (QUEBRADO)
```
Stripe → Webhook URL → ERRO 502 → Usuário não ativado
```

### 3. **ATIVAÇÃO FLOW** ❌ (Dependente do webhook)
```
Webhook → Supabase → Atualizar subscription → Ativar usuário
```

## 🔧 PROBLEMAS IDENTIFICADOS:

### **A. Função Netlify com Erro 502**
- **Localização:** `netlify/functions/stripe-webhook.js`
- **Problema:** Função falha internamente
- **Impacto:** Webhook nunca processa eventos do Stripe

### **B. Possíveis Causas do Erro 502:**
1. **Variáveis de ambiente ausentes/incorretas**
2. **Dependências não instaladas corretamente**
3. **Código da função com erros**
4. **Timeout na execução**
5. **Problemas de conectividade com Supabase**

### **C. Configuração do Stripe**
- **Webhook URL:** `https://correria.pro/.netlify/functions/stripe-webhook`
- **Status:** Configurado mas não funcional
- **Eventos:** Precisam incluir `checkout.session.completed`

## 🛠️ SOLUÇÕES IMPLEMENTADAS:

### **1. Nova Função Webhook Robusta**
- ✅ Logs detalhados em cada etapa
- ✅ Verificação de todas as variáveis de ambiente
- ✅ Tratamento de erros robusto
- ✅ Recuperação automática em falhas
- ✅ Ativação forçada de usuários

### **2. Verificação de Dependências**
- ✅ Stripe SDK configurado corretamente
- ✅ Supabase client inicializado
- ✅ Validação de assinatura do webhook

### **3. Fluxo de Ativação Melhorado**
- ✅ Busca automática de plano ativo
- ✅ Limpeza de trial expirado
- ✅ Logs de auditoria detalhados
- ✅ Verificação pós-ativação

## 🔑 VARIÁVEIS DE AMBIENTE NECESSÁRIAS:

### **No Netlify (Site Settings → Environment Variables):**
```
VITE_SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
STRIPE_SECRET_KEY=sk_test_ou_sk_live_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret
```

### **Como Obter as Chaves:**

#### **STRIPE_SECRET_KEY:**
1. Dashboard Stripe → Developers → API Keys
2. Copiar "Secret key" (sk_test_ ou sk_live_)

#### **STRIPE_WEBHOOK_SECRET:**
1. Dashboard Stripe → Developers → Webhooks
2. Clicar no seu webhook
3. Seção "Signing secret" → Click to reveal

#### **SUPABASE_SERVICE_ROLE_KEY:**
1. Supabase Dashboard → Settings → API
2. Copiar "service_role" key (não a anon key)

## 🎯 PLANO DE TESTE:

### **Fase 1: Verificar Correção da Função**
```bash
# Testar URL do webhook
curl https://correria.pro/.netlify/functions/stripe-webhook
# Deve retornar: {"error":"Método não permitido"} (não mais erro 502)
```

### **Fase 2: Teste de Pagamento Completo**
1. **Criar nova conta** de teste
2. **Fazer pagamento** via Stripe
3. **Aguardar 30 segundos** para webhook processar
4. **Verificar ativação** automática

### **Fase 3: Monitoramento de Logs**
1. **Netlify Dashboard** → Functions → stripe-webhook → Logs
2. **Verificar logs** após pagamento
3. **Confirmar ativação** bem-sucedida

## 🚀 RESULTADO ESPERADO:

Após as correções, o fluxo deve ser:
```
Usuário → Pagamento → Webhook → Ativação Automática → Acesso Liberado
```

**SEM INTERVENÇÃO MANUAL NECESSÁRIA!**

## 📋 CHECKLIST DE VERIFICAÇÃO:

- [ ] Função webhook retorna 405 (não 502)
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado no Stripe
- [ ] Teste de pagamento realizado
- [ ] Usuário ativado automaticamente
- [ ] Logs da função sem erros

## 🆘 BACKUP PLAN:

Se ainda houver problemas, implementamos:
- **Ativação por detecção de customer Stripe**
- **Verificação automática no login**
- **Logs detalhados para debugging**

**OBJETIVO: ATIVAÇÃO 100% AUTOMÁTICA PARA PRODUÇÃO!**