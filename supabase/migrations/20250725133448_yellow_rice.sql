/*
  # Forçar role admin para usuário dev

  1. Correção de Role
    - Atualiza diretamente o role do usuário dev@sonnik.com.br para 'admin'
    - Garante que o perfil existe na tabela profiles
    - Força a sincronização com a tabela auth.users

  2. Verificação
    - Confirma que o usuário existe em auth.users
    - Cria ou atualiza o perfil correspondente
*/

-- Primeiro, vamos verificar se o usuário existe em auth.users
DO $$
DECLARE
    dev_user_id uuid;
BEGIN
    -- Buscar o ID do usuário dev@sonnik.com.br na tabela auth.users
    SELECT id INTO dev_user_id 
    FROM auth.users 
    WHERE email = 'dev@sonnik.com.br' 
    LIMIT 1;
    
    IF dev_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário dev encontrado com ID: %', dev_user_id;
        
        -- Inserir ou atualizar o perfil com role admin
        INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
        VALUES (
            dev_user_id,
            'Desenvolvedor Admin',
            'dev@sonnik.com.br',
            'admin',
            now(),
            now()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = now();
            
        RAISE NOTICE 'Role admin definido com sucesso para dev@sonnik.com.br';
    ELSE
        RAISE NOTICE 'ATENÇÃO: Usuário dev@sonnik.com.br não encontrado em auth.users';
    END IF;
END $$;