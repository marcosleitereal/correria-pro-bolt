# 🔧 GUIA DE TESTE DO WEBHOOK CORRIGIDO

## 🚨 PROBLEMA IDENTIFICADO:
- **Erro 502 "Bad Gateway"** na função webhook
- **Função existe mas falha internamente**
- **Usuário não é ativado automaticamente**

## ✅ CORREÇÕES IMPLEMENTADAS:

### 1. **Logs Detalhados**
- Logs em cada etapa do processo
- Verificação de variáveis de ambiente
- Stack traces completos para debugging

### 2. **Tratamento de Erros Robusto**
- Try/catch em todas as operações críticas
- Recuperação automática em caso de falha
- Logs específicos para cada tipo de erro

### 3. **Verificação de Dependências**
- Validação de todas as variáveis de ambiente
- Verificação de conectividade com Supabase
- Inicialização segura do cliente Stripe

## 🎯 TESTE AGORA:

### **Passo 1: Verificar se a função foi corrigida**
Acesse: `https://correria.pro/.netlify/functions/stripe-webhook`

**Resultado esperado:** 
- ❌ **Antes:** Erro 502 "Bad Gateway"
- ✅ **Agora:** `{"error":"Método não permitido"}` (isso é NORMAL e CORRETO)

### **Passo 2: Fazer um novo pagamento de teste**
1. **Logout** do usuário `treinador1dia@gmail.com`
2. **Criar nova conta** de teste (ex: `teste2@gmail.com`)
3. **Fazer pagamento** completo
4. **Aguardar 30 segundos** para webhook processar
5. **Fazer login** e verificar se foi ativado automaticamente

### **Passo 3: Verificar logs da função**
1. Acesse o **painel do Netlify**
2. Vá em **Functions** → **stripe-webhook**
3. Verifique os **logs** após o pagamento
4. Deve aparecer logs como:
   - `🎯 NETLIFY WEBHOOK: Stripe webhook recebido`
   - `✅ WEBHOOK: Assinatura verificada com sucesso`
   - `✅ WEBHOOK: USUÁRIO ATIVADO COM SUCESSO!`

## 🔍 DEBUGGING:

Se ainda não funcionar, os logs da função Netlify vão mostrar exatamente onde está falhando:

- **Erro de variável de ambiente:** Falta configurar alguma chave
- **Erro de Supabase:** Problema de conectividade ou permissões
- **Erro de Stripe:** Problema com as chaves ou webhook secret

**Agora o webhook deve funcionar perfeitamente para ativação automática!**