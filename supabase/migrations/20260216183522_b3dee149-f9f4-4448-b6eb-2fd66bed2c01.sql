
INSERT INTO public.ordenar_passos (titulo, passos) VALUES
('Compilação de um Programa', ARRAY['Escrever o código-fonte', 'Análise léxica', 'Análise sintática', 'Análise semântica', 'Geração de código intermediário', 'Otimização', 'Geração de código objeto', 'Linkedição', 'Execução']),
('Processo de Deploy de uma Aplicação Web', ARRAY['Commit do código no repositório', 'Pipeline de CI executa os testes', 'Build da aplicação', 'Geração do artefato/imagem', 'Deploy no ambiente de staging', 'Testes de aceitação', 'Deploy em produção']),
('Criação de um Banco de Dados Relacional', ARRAY['Levantamento de requisitos de dados', 'Modelagem conceitual (ER)', 'Modelagem lógica', 'Modelagem física', 'Criação das tabelas (DDL)', 'Inserção de dados iniciais (DML)', 'Configuração de índices e permissões']),
('Resolução de um Problema com Algoritmo', ARRAY['Compreender o problema', 'Identificar entradas e saídas', 'Definir a lógica/passo a passo', 'Escrever o pseudocódigo', 'Implementar na linguagem escolhida', 'Testar com casos de exemplo', 'Corrigir erros e otimizar']),
('Fluxo de uma Requisição HTTP', ARRAY['Cliente digita a URL no navegador', 'Resolução DNS do domínio', 'Estabelecimento da conexão TCP', 'Envio da requisição HTTP', 'Servidor processa a requisição', 'Servidor retorna a resposta HTTP', 'Navegador renderiza a página']),
('Metodologia RUP - Fases', ARRAY['Concepção (Inception)', 'Elaboração', 'Construção', 'Transição']),
('Hierarquia de Memória do Computador (mais rápida → mais lenta)', ARRAY['Registradores', 'Cache L1', 'Cache L2', 'Cache L3', 'Memória RAM', 'SSD/HD', 'Armazenamento em nuvem']),
('Processo de Engenharia de Requisitos', ARRAY['Elicitação de requisitos', 'Análise e negociação', 'Documentação/especificação', 'Validação dos requisitos', 'Gerenciamento de mudanças']),
('Pipeline de Machine Learning', ARRAY['Coleta de dados', 'Limpeza e pré-processamento', 'Análise exploratória', 'Seleção de features', 'Treinamento do modelo', 'Avaliação e validação', 'Deploy do modelo']),
('Ciclo PDCA (Melhoria Contínua)', ARRAY['Plan (Planejar)', 'Do (Executar)', 'Check (Verificar)', 'Act (Agir)']),
('Processo de Teste de Software', ARRAY['Planejamento dos testes', 'Criação dos casos de teste', 'Preparação do ambiente', 'Execução dos testes', 'Registro dos resultados', 'Análise de defeitos', 'Reteste e regressão']),
('Boot de um Sistema Operacional', ARRAY['POST (Power-On Self Test)', 'BIOS/UEFI carrega o bootloader', 'Bootloader carrega o kernel', 'Kernel inicializa drivers', 'Kernel monta o sistema de arquivos', 'Init/Systemd inicia os serviços', 'Interface de login é exibida']),
('Desenvolvimento de um Caso de Uso (UML)', ARRAY['Identificar os atores', 'Identificar os casos de uso', 'Descrever os fluxos principais', 'Descrever fluxos alternativos', 'Descrever fluxos de exceção', 'Criar o diagrama de caso de uso']),
('Protocolo TCP - Three-Way Handshake', ARRAY['Cliente envia SYN', 'Servidor responde com SYN-ACK', 'Cliente confirma com ACK', 'Conexão estabelecida']),
('Processo de Versionamento com Git', ARRAY['git init ou git clone', 'Criar/editar arquivos', 'git add (staging)', 'git commit (salvar snapshot)', 'git push (enviar ao remoto)', 'Pull request / code review', 'Merge na branch principal']);
