-- Patch do schema: adiciona colunas de animação à tabela bosses
-- (characters já tem estas colunas no schema original)

-- Animações de combate para bosses
ALTER TABLE bosses ADD COLUMN gif_attack_url TEXT;
ALTER TABLE bosses ADD COLUMN gif_defend_url TEXT;
ALTER TABLE bosses ADD COLUMN gif_skill_url TEXT;
