# 🚨 GUIA DE ATIVAÇÃO DE EMERGÊNCIA

## 🎯 PROBLEMA CRÍTICO:
**Usuário paga mas não é ativado automaticamente**

### **SINTOMAS:**
- ✅ Pagamento processado no Stripe
- ✅ Webhook recebe eventos (status 200)
- ❌ Usuário continua restrito
- ❌ Plano não é atribuído

---

## 🔧 DIAGNÓSTICO IMEDIATO:

### **1. ACESSE O DIAGNÓSTICO DE EMERGÊNCIA**
1. **Login:** `dev@sonnik.com.br`
2. **Admin → Faturamento**
3. **Procure:** "🚨 DIAGNÓSTICO DE EMERGÊNCIA"
4. **Clique:** "🔍 EXECUTAR DIAGNÓSTICO COMPLETO"

### **2. PROBLEMAS MAIS PROVÁVEIS:**

#### **A. NENHUM PLANO ATIVO**
- **Sintoma:** "NENHUM PLANO PÚBLICO ATIVO"
- **Causa:** Todos os planos estão `is_active = false`
- **Solução:** Ativar pelo menos um plano

#### **B. WEBHOOK NÃO ENCONTRA PLANO**
- **Sintoma:** Logs mostram "Nenhum plano ativo encontrado"
- **Causa:** Query não retorna planos válidos
- **Solução:** Verificar filtros da query

#### **C. ERRO NA INSERÇÃO**
- **Sintoma:** Webhook falha ao inserir na tabela `subscriptions`
- **Causa:** Constraint ou erro de dados
- **Solução:** Verificar logs detalhados

#### **D. VIEW NÃO ATUALIZA**
- **Sintoma:** Dados inseridos mas view não reflete
- **Causa:** Cache ou problema na view
- **Solução:** Refresh da view

---

## ⚡ ATIVAÇÃO MANUAL DE EMERGÊNCIA:

### **OPÇÃO 1: Via Diagnóstico**
1. **Execute o diagnóstico**
2. **Clique:** "🚀 ATIVAR USUÁRIO AGORA"
3. **Usuário ativado em 2 segundos**

### **OPÇÃO 2: Via SQL Direto**
```sql
-- Ativar usuário manualmente
DELETE FROM subscriptions WHERE user_id = (
  SELECT id FROM profiles WHERE email = '2dia@teste.com'
);

INSERT INTO subscriptions (user_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
VALUES (
  (SELECT id FROM profiles WHERE email = '2dia@teste.com'),
  (SELECT id FROM plans WHERE is_active = true AND name != 'Restrito' LIMIT 1),
  'active',
  NULL,
  NOW(),
  NOW() + INTERVAL '1 year'
);
```

---

## 🎯 RESULTADO ESPERADO:

Após a ativação:
- ✅ **Status:** "Plano Ativo"
- ✅ **Acesso:** Liberado
- ✅ **Plano:** Nome do plano ativo
- ✅ **Funcionalidades:** Todas desbloqueadas

---

## 📞 SE AINDA NÃO FUNCIONAR:

1. **Verificar se existem planos ativos**
2. **Verificar se webhook está processando**
3. **Verificar logs detalhados do Netlify**
4. **Usar ativação manual como fallback**

**VAMOS RESOLVER ISSO AGORA!**