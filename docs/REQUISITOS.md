# 📋 Requisitos do Gacha Game

Este documento registra todos os requisitos e decisões de design do projeto.

---

## ✅ Requisitos Aprovados

### 1. Sistema de Contas
- [x] Registro de jogadores (username, email, senha)
- [x] Login com JWT + bcrypt
- [x] Perfil do jogador
- [x] Avatar personalizável
- [x] Moedas: gems (premium) e gold (comum)

### 2. Sistema de Personagens (Units)
- [x] Catálogo com 6 raridades: common, rare, epic, legendary, mythic, secret
- [x] Atributos exorbitantes com abreviações (k, m, b, t, qd, sx)
- [x] Personagens exclusivos do admin: Frieren, Gilgamesh, Madoka
- [x] Bag limitada a 20 personagens
- [x] Time ativo limitado a 3 personagens
- [x] Sistema de evolução por anime (gasta itens de boss)
- [x] Evolução pode mudar a raridade (ex: epic → legendary → mythic → secret)
- [ ] **Grade de unidades em cartões quadrados** — retrato, raridade colorida, nome, nível, trait, ícones (evolução, shiny, cosmético)
- [ ] **Barra de limite** no topo do inventário (ex: 12/20)
- [ ] **Campo de busca** por nome
- [ ] **Filtros** por raridade, elemento/afinidade, evoluído/não, trait, favoritos, tradable, locked
- [ ] **Sistema de favoritar e bloquear (Lock)** — unidades favoritas/locked não podem ser deletadas até desbloquear
- [ ] **Seleção múltipla** de unidades
- [ ] **Janela de confirmação dupla** antes de deletar (evita apagar Mythics/Secrets por acidente)
- [ ] **Painel lateral com detalhes** da unidade selecionada (nome, raridade, nível, trait, stats, habilidades, botões de equipar/evoluir/XP/bloquear/favoritar/deletar)

### 2.1 Bag de Itens
- [ ] Separada das unidades
- [ ] Itens organizados por **abas/categorias**: Materiais de evolução, Itens de XP, Portais, Chaves, Boosts, Itens de eventos, Recursos
- [ ] Ícones próprios por categoria
- [ ] Pesquisa e organização automática
- [ ] Sem misturar centenas de materiais

### 3. Sistema de Banners e Gacha
- [x] Banners mistos com personagens de vários animes
- [x] Personagens de Bleach, Frieren e JoJo são míticos/secretos e fortes
- [x] Quanto mais raro, mais forte
- [x] Pull 1x (100 gems) e Pull 10x (1000 gems)
- [x] Probabilidades ponderadas por drop_rate
- [x] Personagens exclusivos do admin NUNCA aparecem nos banners

### 4. Sistema de Bosses
- [x] Bosses por anime (Aizen, Ulquiorra, Kars, DIO, etc.)
- [x] Dificuldades: easy, normal, hard, nightmare
- [x] Drops exclusivos por boss (Fragmento de Hogyoku, Pedra Vermelha, etc.)
- [x] Itens de boss usados para evolução

### 5. Sistema de Combate
- [x] Time de 3 personagens
- [x] PvP assíncrono (desafiar saves de outros jogadores)
- [x] Ranking global com sistema Elo
- [ ] **ANIMAÇÕES DE COMBATE** (ver seção abaixo)

### 6. Sistema de Missões
- [ ] Missões diárias, semanais e de história
- [ ] Recompensas em gems e gold

### 7. Sistema de Loja
- [ ] Loja com itens, poções, tickets
- [ ] Compra com gems e gold
- [ ] **Poção de Sorte** — aumenta temporariamente as chances de drop de raridades altas
- [ ] **Sorte** — item que aumenta a sorte do jogador
- [ ] **Vender personagens** — vender/excluir personagens por gold
- [ ] **Vender lendários e secretos** — apenas por gems (não gold)

### 8. Sistema de Eventos
- [ ] Eventos temporários
- [ ] Banners de evento

### 9. Login Diário
- [ ] Recompensa diária
- [ ] Streak de dias

### 10. Conquistas
- [ ] Conquistas por categoria (coleção, batalha, progressão, gacha, especial)
- [ ] Recompensas em gems e gold

### 11. Administração
- [ ] Painel admin
- [ ] Gerenciar personagens, banners, bosses

### 12. Ferramentas Python
- [ ] Geradores de personagens
- [ ] Balanceamento de estatísticas
- [ ] Simulações de taxas do gacha
- [ ] Edição de imagens (Pillow)
- [ ] Análise de dados dos jogadores
- [ ] Scripts de administração

---

## 🖥️ Requisição: Layout da Interface (APROVADA)

**Data:** 11/08/2026
**Status:** Em implementação

### Telas

#### 1. Tela de Login/Criar Conta
- Formulário de login
- Opção de criar conta
- Design moderno e atrativo

#### 2. Tela de Banners (tela principal)
**Layout:**
- **Canto superior direito:** Gems 💎 e Gold 🪙
- **Canto superior esquerdo:** Contador de personagens (ex: "12/20")
- **Lado esquerdo (em ordem):**
  1. Multiplayer
  2. Ranking
  3. Missões
  4. Bosses
- **Canto inferior direito:** Inventário (itens para evoluir personagens)
- **Ao lado do inventário:** Bag (personagens do jogador)

**Banner visual:**
- Mostra as imagens dos personagens principais do banner
- O personagem **secreto NUNCA aparece** na imagem do banner
- Layout do banner: **2 lendários nas pontas, 1 mítico no centro**
- O banner pode ter **mais de 1 lendário**, mas **nunca mais de 1 mítico ou 1 secreto**
- Banners são **aleatórios** (não por anime)

---

## 🎬 Requisição: Animações de Combate (APROVADA)

**Data:** 11/08/2026
**Status:** Pendente (frontend futuro)

### Descrição
Durante o combate, quando um personagem ataca, a imagem estática deve mudar para um **GIF animado** da ação. Abaixo da imagem/GIF, deve aparecer o **status do personagem** (parado, defendendo, atacando), com a imagem e o GIF mudando de estado conforme a ação.

### Estados de animação por personagem
| Estado | Tipo de mídia | Descrição |
|--------|--------------|-----------|
| `idle` | Imagem estática | Personagem parado (padrão) |
| `attacking` | GIF animado | Personagem atacando |
| `defending` | GIF animado | Personagem defendendo |
| `skill` | GIF animado | Personagem usando habilidade especial |
| `hit` | GIF animado | Personagem recebendo dano |
| `victory` | GIF animado | Personagem vencendo |
| `defeat` | GIF animado | Personagem derrotado |

### Requisitos técnicos
- Cada personagem terá URLs para imagem estática + GIFs de cada estado
- O frontend troca a mídia conforme o estado do personagem no combate
- O status aparece em um overlay/legenda abaixo da imagem
- Os GIFs serão armazenados localmente (65GB de espaço livre disponível)
- Os GIFs podem ser baixados da internet ou gerados com Python (Pillow)

### Impacto no banco de dados
A tabela `characters` precisa de campos adicionais para armazenar as URLs de cada estado:

```sql
-- Campos a adicionar em characters:
image_idle_url      TEXT,  -- Imagem parado
gif_attack_url      TEXT,  -- GIF atacando
gif_defend_url      TEXT,  -- GIF defendendo
gif_skill_url       TEXT,  -- GIF habilidade
gif_hit_url         TEXT,  -- GIF recebendo dano
gif_victory_url     TEXT,  -- GIF vencendo
gif_defeat_url      TEXT,  -- GIF derrotado
```

### Armazenamento
- Pasta `assets/images/` — imagens estáticas dos personagens
- Pasta `assets/gifs/` — GIFs de animação
- Pasta `assets/sounds/` — sons de combate

---

## 📝 Requisições Futuras (Backlog)

- [ ] Interface moderna com React (opcional)
- [ ] Eventos sazonais
- [ ] Passe de batalha