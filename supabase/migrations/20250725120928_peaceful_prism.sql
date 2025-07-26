/*
  # Criar bucket de avatars no Supabase Storage

  1. Storage
    - Criar bucket público 'avatars'
    - Configurar políticas de acesso para upload e visualização
    - Permitir apenas imagens (jpg, png, gif, webp)

  2. Segurança
    - Usuários podem fazer upload apenas de seus próprios avatars
    - Visualização pública dos avatars
    - Limite de tamanho de arquivo
*/

-- Criar bucket de avatars (público para visualização)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Política para permitir que usuários façam upload de seus próprios avatars
CREATE POLICY "Usuários podem fazer upload de seus próprios avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários atualizem seus próprios avatars
CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários excluam seus próprios avatars
CREATE POLICY "Usuários podem excluir seus próprios avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualização pública dos avatars
CREATE POLICY "Avatars são publicamente visíveis"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');