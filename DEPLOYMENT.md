# Guia de Implantação do Correria.Pro na Vercel

Siga estes passos para publicar sua aplicação em produção:

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você tem:
- ✅ Conta no GitHub com o código do projeto
- ✅ Projeto Supabase configurado e funcionando
- ✅ Domínio personalizado (opcional, mas recomendado)

## 🚀 Parte 1: Conectar e Implantar na Vercel

### 1. Criar Conta na Vercel
- Acesse [vercel.com](https://vercel.com)
- Clique em "Sign Up" e conecte com sua conta do GitHub
- Isso permitirá que a Vercel acesse seus repositórios automaticamente

### 2. Importar o Projeto
- No dashboard da Vercel, clique em **"Add New... → Project"**
- Encontre o repositório **"Correria.Pro"** na lista
- Clique em **"Import"** ao lado do repositório

### 3. Configurar o Projeto
A Vercel detectará automaticamente que é um projeto Vite + React. Mantenha as configurações padrão:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Configurar Variáveis de Ambiente (CRÍTICO)
Na seção **"Environment Variables"**, adicione as seguintes variáveis:

```
VITE_SUPABASE_URL
```
**Valor:** Cole aqui a URL do seu projeto Supabase (encontrada em Settings → API)

```
VITE_SUPABASE_ANON_KEY
```
**Valor:** Cole aqui a chave `anon/public` do Supabase (encontrada em Settings → API)

⚠️ **IMPORTANTE:** Certifique-se de que as variáveis começam com `VITE_` (não `NEXT_PUBLIC_`)

### 5. Fazer o Deploy
- Clique no botão **"Deploy"**
- Aguarde o processo de build (geralmente 2-3 minutos)
- Sua aplicação estará disponível em um domínio temporário da Vercel (ex: `correria-pro-xyz.vercel.app`)

## 🌐 Parte 2: Configurar Domínio Personalizado

### 1. Acessar Configurações de Domínio
- No painel do projeto na Vercel, vá para **"Settings" → "Domains"**

### 2. Adicionar Domínio
- Digite seu domínio (ex: `correria.pro`)
- Clique em **"Add"**

### 3. Configurar DNS
A Vercel fornecerá registros DNS para configurar:

**Para domínios principais (correria.pro):**
```
Type: A
Name: @
Value: 76.76.19.61
```

**Para subdomínios (www.correria.pro):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4. Configurar no Provedor de Domínio
- Acesse o painel do seu provedor (GoDaddy, Registro.br, etc.)
- Vá para "Gerenciar DNS" ou "DNS Management"
- Adicione os registros fornecidos pela Vercel
- Salve as alterações

### 5. Verificar e Aguardar
- Volte para a Vercel e clique em **"Verify"**
- A propagação DNS pode levar de 30 minutos a 24 horas
- A Vercel configurará automaticamente o SSL quando o DNS estiver ativo

## 🔧 Parte 3: Configurações Pós-Deploy

### 1. Configurar URLs no Supabase
No painel do Supabase, vá para **Authentication → URL Configuration** e adicione:
- **Site URL:** `https://seudominio.com`
- **Redirect URLs:** `https://seudominio.com/**`

### 2. Configurar Webhooks (Se Aplicável)
Se você configurou webhooks do Stripe:
- Acesse o dashboard do Stripe
- Vá para **Developers → Webhooks**
- Atualize a URL do endpoint para: `https://seudominio.com/api/webhooks/stripe`

### 3. Testar a Aplicação
- ✅ Teste o login/cadastro
- ✅ Verifique se os dados carregam corretamente
- ✅ Teste a criação de corredores e treinos
- ✅ Confirme que as notificações funcionam

## 🔄 Parte 4: Atualizações Futuras

### Deploy Automático
A Vercel está configurada para deploy automático:
- Toda vez que você fizer `git push` para a branch `main`
- A Vercel automaticamente fará rebuild e deploy
- Você receberá notificações por email sobre o status

### Monitoramento
- Acesse **"Analytics"** no painel da Vercel para ver métricas
- Configure **"Notifications"** para receber alertas de erro
- Use **"Functions"** para monitorar performance das Edge Functions

## 🆘 Solução de Problemas

### Build Falha
Se o build falhar:
1. Verifique se todas as dependências estão no `package.json`
2. Confirme que não há erros de TypeScript
3. Teste o build localmente: `npm run build`

### Variáveis de Ambiente
Se a aplicação não conecta com Supabase:
1. Verifique se as variáveis estão corretas na Vercel
2. Confirme que começam com `VITE_` (não `NEXT_PUBLIC_`)
3. Redeploy após alterar variáveis

### Problemas de DNS
Se o domínio não funciona:
1. Verifique se os registros DNS estão corretos
2. Use ferramentas como [whatsmydns.net](https://whatsmydns.net) para verificar propagação
3. Aguarde até 24h para propagação completa

## 📞 Suporte

- **Vercel:** [vercel.com/help](https://vercel.com/help)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Documentação do Projeto:** Consulte os comentários no código

---

🎉 **Parabéns!** Sua aplicação Correria.Pro está agora em produção e acessível globalmente!