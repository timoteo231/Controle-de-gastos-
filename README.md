# Controle de Compras

Aplicativo Next.js + Supabase para registrar compras, notas e tributos.

## Requisitos
- Node.js 20.9 ou superior (recomendado Node 22 LTS)
- Projeto Supabase configurado

## Configuração
1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do projeto Supabase.
3. No Supabase, habilite **Authentication → Sign In / Providers → Anonymous Sign-Ins**.
4. Mantenha o Row Level Security (RLS) habilitado nas tabelas. As políticas devem limitar cada registro a `auth.uid()`.
5. Confirme que o bucket privado `invoice-images` e as políticas de Storage do projeto estão configurados.
6. Instale e execute:

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Publicação
Envie o conteúdo do projeto ao GitHub e importe o repositório na Vercel. Configure as mesmas duas variáveis de ambiente na Vercel e publique.

## Atenção sobre acesso anônimo
O app cria uma sessão anônima automaticamente. Ela é persistida no navegador/aparelho. Se o usuário limpar os dados do navegador, trocar de aparelho ou encerrar a sessão, poderá perder o acesso aos dados vinculados àquela identidade anônima. Para dados importantes, implemente posteriormente uma opção de vincular e-mail/Google à sessão.

## Escopo atual
- Acesso automático por sessão anônima Supabase.
- Painel mensal de compras e tributos.
- Cadastro manual de compra.
- Upload privado de imagem/PDF da nota.
- Histórico e exclusão de compras.
- OCR/leitura automática de notas fiscais ainda não implementados.

Este pacote é um projeto-fonte para revisão e continuidade. Antes de substituir o deployment atual, valide as políticas e os nomes das colunas do banco no Supabase.
