# 🧪 GUIA COMPLETO DE TESTE DO FLUXO - CORRERIA.PRO

## 🎯 OBJETIVO
Testar o fluxo completo: Cadastro → Trial → Expiração → Pagamento → Ativação

---

## 📋 PRÉ-REQUISITOS

### ✅ Verificações Iniciais:
1. **Supabase configurado** (variáveis de ambiente)
2. **Stripe configurado** (chaves e webhook)
3. **Netlify functions** deployadas
4. **Plano "Restrito"** existe na tabela `plans`

### 🔧 Configurações do Admin:
1. **Login como:** `dev@sonnik.com.br`
2. **Ir para:** Admin → Faturamento → Configurações do Período de Teste
3. **Verificar valores:**
   - Duração: 35 dias
   - Atletas: 33
   - Treinos: 44

---

## 🧪 TESTE 1: CADASTRO E PERÍODO DE TESTE (FASE 1)

### **Passo 1.1: Criar Nova Conta**
```
Email: teste-fluxo-completo@gmail.com
Nome: Teste Fluxo Completo
Senha: 123456
```

### **Passo 1.2: Verificar Cadastro**
- ✅ **Mensagem:** "Conta criada com sucesso! Aguarde..."
- ✅ **Aguardar:** 7 segundos para processamento
- ✅ **Redirecionamento:** Para `/dashboard`

### **Passo 1.3: Verificar Trial Ativo**
1. **No Dashboard:** Deve mostrar acesso total
2. **No Perfil:** Verificar informações do plano:
   - Status: "🎯 Período de Teste"
   - Dias restantes: ~35 dias
   - Acesso: "✅ Liberado"

### **Passo 1.4: Testar Funcionalidades**
- ✅ **Criar corredor:** Deve funcionar
- ✅ **Gerar treino:** Deve funcionar
- ✅ **Acessar todas as páginas:** Sem bloqueio

### **✅ RESULTADO ESPERADO FASE 1:**
- Usuário entra automaticamente em período de teste
- Todas as funcionalidades liberadas
- Contador de dias funcionando

---

## 🚫 TESTE 2: SIMULAÇÃO DE EXPIRAÇÃO (FASE 2)

### **Passo 2.1: Simular Trial Expirado**
**Opção A - Via SQL (Recomendado):**
```sql
-- Executar no Supabase SQL Editor
UPDATE subscriptions 
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'teste-fluxo-completo@gmail.com'
);
```

**Opção B - Via Admin Manual:**
1. Login como `dev@sonnik.com.br`
2. Admin → Faturamento → Gerenciamento de Assinaturas
3. Encontrar o usuário teste
4. Atribuir plano "🚫 Restrito"

### **Passo 2.2: Fazer Logout/Login**
- Logout do usuário teste
- Login novamente
- **Aguardar carregamento** dos dados

### **Passo 2.3: Verificar Bloqueio**
1. **Dashboard:** Deve mostrar mensagem de bloqueio
2. **Perfil:** Verificar status:
   - Status: "🚫 CONTA BLOQUEADA"
   - Plano: "Restrito"
   - Acesso: "❌ Restrito"

### **Passo 2.4: Testar Funcionalidades Bloqueadas**
- ❌ **Criar corredor:** Deve mostrar tela de upgrade
- ❌ **Gerar treino:** Deve mostrar tela de upgrade
- ❌ **Todas as páginas:** Devem mostrar `SubscriptionGuard`

### **Passo 2.5: Verificar Botão de Upgrade**
- ✅ **Botão:** "🚀 FAZER UPGRADE AGORA"
- ✅ **Redirecionamento:** Para `/pricing`

### **✅ RESULTADO ESPERADO FASE 2:**
- Usuário completamente bloqueado
- Mensagens claras de upgrade
- Botões direcionando para pricing

---

## 💳 TESTE 3: FLUXO DE PAGAMENTO (FASE 3)

### **Passo 3.1: Processo de Pagamento**
1. **Na página `/pricing`:** Escolher um plano
2. **Clicar:** "Escolher Plano" ou "Começar Agora"
3. **Selecionar gateway:** Stripe
4. **Preencher dados de teste:**
   ```
   Cartão: 4242 4242 4242 4242
   Validade: 12/34
   CVC: 123
   ```

### **Passo 3.2: Verificar Página de Sucesso**
- ✅ **URL:** `/checkout/success?session_id=cs_...`
- ✅ **Mensagem:** "Assinatura Ativada com Sucesso!"
- ✅ **Status:** "Ativando sua conta..." (com loader)
- ✅ **Aguardar:** 10 segundos para processamento

### **Passo 3.3: Verificar Webhook (Opcional)**
**No Netlify Functions:**
1. Ir para: https://app.netlify.com
2. Functions → `stripe-webhook`
3. Verificar logs recentes
4. Procurar por: "✅ WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!"

### **Passo 3.4: Verificar Ativação**
1. **Redirecionamento:** Para `/dashboard`
2. **No Perfil:** Verificar status:
   - Status: "✅ Plano Ativo"
   - Plano: Nome do plano escolhido
   - Acesso: "✅ Liberado"

### **Passo 3.5: Testar Funcionalidades Restauradas**
- ✅ **Criar corredor:** Deve funcionar
- ✅ **Gerar treino:** Deve funcionar
- ✅ **Todas as páginas:** Acesso total restaurado

### **✅ RESULTADO ESPERADO FASE 3:**
- Ativação automática após pagamento
- Acesso total restaurado
- Status atualizado corretamente

---

## 🔍 MONITORAMENTO E DEBUGGING

### **Logs para Verificar:**

#### **1. Console do Navegador:**
```javascript
// Procurar por estes logs:
"✅ AUTH: Usuário criado com sucesso"
"✅ SUBSCRIPTION: Trial ativo por X dias"
"🚫 GUARD: PLANO RESTRITO - BLOQUEIO TOTAL"
"💳 SUCCESS: Página de sucesso carregada"
```

#### **2. Supabase SQL (Verificação Manual):**
```sql
-- Verificar status do usuário teste
SELECT 
  p.email,
  s.status,
  s.trial_ends_at,
  pl.name as plan_name,
  usd.has_access
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
LEFT JOIN plans pl ON s.plan_id = pl.id
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id
WHERE p.email = 'teste-fluxo-completo@gmail.com';
```

#### **3. Netlify Functions Logs:**
- Acessar: https://app.netlify.com
- Functions → `stripe-webhook` → Logs
- Procurar por logs após pagamento

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema 1: Trial não ativado**
**Sintomas:** Usuário aparece como "expirado" logo após cadastro
**Solução:** 
- Verificar trigger `handle_new_user` no Supabase
- Verificar configurações em `app_settings`

### **Problema 2: Bloqueio não funciona**
**Sintomas:** Usuário com trial expirado ainda tem acesso
**Solução:**
- Executar função `auto-restrict-expired-trials`
- Verificar se plano "Restrito" existe

### **Problema 3: Pagamento não ativa**
**Sintomas:** Usuário paga mas continua bloqueado
**Solução:**
- Verificar logs do webhook no Netlify
- Verificar configuração do webhook no Stripe
- Usar ativação manual no Admin

---

## ✅ CHECKLIST FINAL

- [ ] **Fase 1:** Cadastro cria trial automaticamente
- [ ] **Fase 1:** Trial tem duração correta (35 dias)
- [ ] **Fase 1:** Todas as funcionalidades liberadas
- [ ] **Fase 2:** Trial expirado bloqueia acesso
- [ ] **Fase 2:** Mensagens de upgrade aparecem
- [ ] **Fase 2:** Botões direcionam para pricing
- [ ] **Fase 3:** Pagamento ativa automaticamente
- [ ] **Fase 3:** Acesso total restaurado
- [ ] **Fase 3:** Status atualizado no perfil

---

## 🎯 TESTE RÁPIDO (5 MINUTOS)

Se quiser um teste rápido:

1. **Cadastrar** nova conta
2. **Verificar** se entra em trial
3. **Simular expiração** via SQL
4. **Verificar** bloqueio
5. **Ativar manualmente** via Admin

**Comando SQL para ativação manual:**
```sql
UPDATE subscriptions 
SET status = 'active', trial_ends_at = NULL, plan_id = (
  SELECT id FROM plans WHERE name != 'Restrito' LIMIT 1
)
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'teste-fluxo-completo@gmail.com'
);
```

---

**🚀 BOA SORTE COM OS TESTES!**