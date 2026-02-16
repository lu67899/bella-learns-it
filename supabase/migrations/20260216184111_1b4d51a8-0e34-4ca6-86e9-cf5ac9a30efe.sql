
UPDATE public.ordenar_passos SET explicacao = 'Pense assim: antes de construir uma casa, você precisa saber o que quer (requisitos), fazer a planta (análise e projeto), depois construir (implementação), ver se tá tudo certo (testes), entregar a chave (implantação) e consertar o que precisar depois (manutenção). Software é igual!' WHERE titulo = 'Ciclo de Vida do Software (Cascata)';

UPDATE public.ordenar_passos SET explicacao = 'Imagine uma planilha bagunçada com dados repetidos. A normalização é como organizar essa bagunça passo a passo: primeiro tira as repetições, depois garante que cada informação depende só da sua chave, e por fim elimina informações que "pegam carona" em outras.' WHERE titulo = 'Normalização de Banco de Dados';

UPDATE public.ordenar_passos SET explicacao = 'É como entrar num prédio com porteiro: você mostra seu documento (email/senha), o porteiro confere se é válido, procura seu nome na lista, compara sua foto, libera sua entrada e te direciona pro andar certo.' WHERE titulo = 'Processo de Login com Autenticação';

UPDATE public.ordenar_passos SET explicacao = 'Pense no Scrum como uma semana de trabalho organizada: no início você planeja o que vai fazer, todo dia faz uma reunião rápida pra ver como tá, no final mostra o que fez pro chefe e depois conversa com o time sobre o que pode melhorar.' WHERE titulo = 'Metodologia Scrum - Fluxo de uma Sprint';

UPDATE public.ordenar_passos SET explicacao = 'Imagine enviar uma carta: começa no papel (físico), coloca no envelope (enlace), endereça (rede), escolhe o correio (transporte), combina o horário de entrega (sessão), traduz o idioma se precisar (apresentação) e finalmente a pessoa lê (aplicação). Vai do mais concreto pro mais abstrato!' WHERE titulo = 'Modelo OSI - Camadas de Rede';

UPDATE public.ordenar_passos SET explicacao = 'É como traduzir um texto: primeiro você lê palavra por palavra (léxica), depois vê se as frases fazem sentido gramatical (sintática), entende o significado (semântica), faz um rascunho (código intermediário), melhora a tradução (otimização) e entrega a versão final.' WHERE titulo = 'Compilação de um Programa';

UPDATE public.ordenar_passos SET explicacao = 'Pense em publicar um livro: você escreve o texto (commit), alguém revisa (CI/testes), formata pra impressão (build), cria o exemplar (artefato), manda pra uma livraria teste (staging), confere se tá tudo ok e então distribui pra todo mundo (produção).' WHERE titulo = 'Processo de Deploy de uma Aplicação Web';

UPDATE public.ordenar_passos SET explicacao = 'É como organizar um armário novo: primeiro descobre o que vai guardar (requisitos), desenha como organizar (modelo conceitual e lógico), monta as prateleiras (modelo físico e tabelas), coloca as coisas dentro (dados) e etiqueta tudo (índices e permissões).' WHERE titulo = 'Criação de um Banco de Dados Relacional';

UPDATE public.ordenar_passos SET explicacao = 'É como fazer uma receita: primeiro entende o prato que quer fazer, vê os ingredientes que tem e o resultado esperado, pensa no passo a passo, anota a receita, cozinha, prova, e ajusta o tempero se precisar.' WHERE titulo = 'Resolução de um Problema com Algoritmo';

UPDATE public.ordenar_passos SET explicacao = 'Quando você digita um site, é como ligar pra alguém: primeiro descobre o número (DNS), faz a ligação (TCP), fala o que quer (requisição), a pessoa responde (servidor processa), e você ouve a resposta (navegador mostra a página).' WHERE titulo = 'Fluxo de uma Requisição HTTP';

UPDATE public.ordenar_passos SET explicacao = 'São 4 fases como construir uma empresa: primeiro tem a ideia (concepção), planeja como vai funcionar (elaboração), constrói de verdade (construção) e entrega pros clientes usarem (transição).' WHERE titulo = 'Metodologia RUP - Fases';

UPDATE public.ordenar_passos SET explicacao = 'Pense nas gavetas de uma cômoda: a de cima é pequena mas você pega rápido (registradores/cache), as do meio são maiores mas mais lentas (RAM), e o porão tem muito espaço mas demora pra ir lá (HD/nuvem). Quanto mais perto de você, mais rápido!' WHERE titulo LIKE 'Hierarquia de Memória%';

UPDATE public.ordenar_passos SET explicacao = 'É como planejar uma festa: primeiro pergunta o que as pessoas querem (elicitação), discute o que dá pra fazer (análise), anota tudo (documentação), confirma com todo mundo se tá certo (validação) e ajusta se alguém mudar de ideia (gerenciamento).' WHERE titulo = 'Processo de Engenharia de Requisitos';

UPDATE public.ordenar_passos SET explicacao = 'É como ensinar um robô a reconhecer gatos: coleta fotos (dados), tira as ruins (limpeza), olha os padrões (exploratória), escolhe o que importa (features), treina o robô (modelo), testa se acerta (avaliação) e coloca pra funcionar (deploy).' WHERE titulo = 'Pipeline de Machine Learning';

UPDATE public.ordenar_passos SET explicacao = 'É como estudar pra prova: planeja o que vai estudar (Plan), estuda (Do), faz um simulado pra ver se aprendeu (Check), e muda a estratégia se não foi bem (Act). Depois repete!' WHERE titulo = 'Ciclo PDCA (Melhoria Contínua)';

UPDATE public.ordenar_passos SET explicacao = 'É como revisar uma redação: planeja o que vai verificar, cria uma lista do que conferir, prepara o material, lê o texto marcando erros, anota os problemas, analisa o que errou e depois confere de novo se corrigiu tudo.' WHERE titulo = 'Processo de Teste de Software';

UPDATE public.ordenar_passos SET explicacao = 'Ligar o computador é como acordar de manhã: o corpo faz um check-up (POST), o despertador toca (BIOS), o cérebro liga (kernel), os sentidos ativam (drivers), você reconhece o quarto (sistema de arquivos), começa sua rotina (serviços) e abre os olhos (tela de login).' WHERE titulo = 'Boot de um Sistema Operacional';

UPDATE public.ordenar_passos SET explicacao = 'É como escrever o roteiro de um filme: primeiro define os personagens (atores), depois as cenas (casos de uso), escreve a história principal, pensa nas alternativas, prevê os imprevistos e por fim desenha o storyboard (diagrama).' WHERE titulo LIKE 'Desenvolvimento de um Caso de Uso%';

UPDATE public.ordenar_passos SET explicacao = 'É como um aperto de mão: uma pessoa estende a mão (SYN), a outra estende de volta e aperta (SYN-ACK), a primeira confirma o aperto (ACK). Pronto, agora podem conversar!' WHERE titulo LIKE 'Protocolo TCP%';

UPDATE public.ordenar_passos SET explicacao = 'Pense no Git como um caderno de rascunho: você pega o caderno (clone), escreve (edita), marca o que quer salvar (add), tira uma foto da página (commit), manda pro grupo (push), alguém revisa (pull request) e aceita as mudanças (merge).' WHERE titulo LIKE 'Processo de Versionamento%';
