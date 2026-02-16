
INSERT INTO public.ordenar_passos (titulo, passos) VALUES
('Ciclo de Vida do Software (Cascata)', ARRAY['Levantamento de Requisitos', 'Análise', 'Projeto (Design)', 'Implementação', 'Testes', 'Implantação', 'Manutenção']),
('Normalização de Banco de Dados', ARRAY['Identificar a tabela não normalizada', 'Aplicar 1ª Forma Normal (1FN) - eliminar grupos repetitivos', 'Aplicar 2ª Forma Normal (2FN) - eliminar dependências parciais', 'Aplicar 3ª Forma Normal (3FN) - eliminar dependências transitivas']),
('Processo de Login com Autenticação', ARRAY['Usuário insere email e senha', 'Sistema valida os campos', 'Sistema consulta o banco de dados', 'Sistema compara hash da senha', 'Sistema gera token de sessão', 'Usuário é redirecionado ao painel']),
('Metodologia Scrum - Fluxo de uma Sprint', ARRAY['Sprint Planning', 'Daily Scrum', 'Desenvolvimento das tarefas', 'Sprint Review', 'Sprint Retrospective']),
('Modelo OSI - Camadas de Rede', ARRAY['Física', 'Enlace de Dados', 'Rede', 'Transporte', 'Sessão', 'Apresentação', 'Aplicação']);
