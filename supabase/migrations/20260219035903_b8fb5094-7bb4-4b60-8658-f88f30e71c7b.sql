
-- Remove os que não funcionaram
DELETE FROM public.jogos_iframe WHERE nome IN ('2048', 'Pac-Man');

-- Adicionar jogos do Playpager (permitidos para iframe)
INSERT INTO public.jogos_iframe (nome, descricao, icone, iframe_url, ordem, ativo) VALUES
('Xadrez', 'Jogue xadrez contra o computador!', '♟️', 'https://playpager.com/embed/chess/index.html', 1, true),
('Damas', 'Jogo clássico de damas contra a IA', '⚫', 'https://playpager.com/embed/checkers/index.html', 2, true),
('Sudoku', 'Resolva o puzzle numérico clássico', '🔢', 'https://playpager.com/embed/sudoku/index.html', 3, true),
('Blocos', 'Encaixe os blocos que caem - estilo Tetris!', '🧱', 'https://playpager.com/embed/cubes/index.html', 4, true),
('Paciência', 'O clássico jogo de cartas Solitaire', '🃏', 'https://playpager.com/embed/solitaire/index.html', 5, true),
('Othello', 'Domine o tabuleiro no Reversi/Othello', '⚪', 'https://playpager.com/embed/reversi/index.html', 6, true),
('Caça-Palavra', 'Encontre as palavras escondidas (inglês)', '🔤', 'https://playpager.com/embed/wordpuzzle/index.html', 7, true);
