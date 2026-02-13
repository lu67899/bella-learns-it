export interface Resumo {
  id: string;
  materia: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  isCustom?: boolean;
}

export const materias = [
  // Tecnologia
  "Programação",
  "Banco de Dados",
  "Redes de Computadores",
  "Engenharia de Software",
  "Estrutura de Dados",
  "Sistemas Operacionais",
  // Ciências Exatas
  "Matemática",
  "Física",
  "Estatística",
  "Cálculo",
  // Ciências Humanas
  "Direito",
  "Administração",
  "Contabilidade",
  "Economia",
  "Psicologia",
  "Sociologia",
  "Filosofia",
  "História",
  // Saúde
  "Medicina",
  "Enfermagem",
  "Farmácia",
  "Nutrição",
  // Engenharias
  "Engenharia Civil",
  "Engenharia Elétrica",
  "Engenharia Mecânica",
  // Comunicação & Educação
  "Letras",
  "Pedagogia",
  "Marketing",
  // Outros
  "Outro",
];

export const resumosIniciais: Resumo[] = [
  {
    id: "r1",
    materia: "Programação",
    titulo: "Paradigmas de Programação",
    conteudo: `**Paradigma Imperativo**: O programador descreve passo a passo como o programa deve executar. Exemplos: C, Pascal.\n\n**Paradigma Orientado a Objetos (POO)**: Organiza o código em objetos que possuem atributos e métodos. Pilares: Encapsulamento, Herança, Polimorfismo e Abstração. Exemplos: Java, C#, Python.\n\n**Paradigma Funcional**: Baseado em funções matemáticas puras, sem efeitos colaterais. Exemplos: Haskell, Elixir.\n\n**Paradigma Declarativo**: O programador descreve o que deseja, não como. Exemplo: SQL, HTML.`,
    tags: ["paradigmas", "POO", "funcional"],
  },
  {
    id: "r2",
    materia: "Banco de Dados",
    titulo: "Modelo Relacional e SQL",
    conteudo: `**Modelo Relacional**: Dados organizados em tabelas (relações) com linhas (tuplas) e colunas (atributos). Cada tabela tem uma chave primária (PK).\n\n**SQL Básico**:\n- \`SELECT\`: consulta dados\n- \`INSERT\`: insere registros\n- \`UPDATE\`: atualiza dados\n- \`DELETE\`: remove registros\n\n**Normalização**: Processo de organizar tabelas para reduzir redundância. Formas normais: 1FN, 2FN, 3FN.\n\n**Joins**: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN — combinam dados de múltiplas tabelas.`,
    tags: ["SQL", "relacional", "normalização"],
  },
  {
    id: "r3",
    materia: "Redes de Computadores",
    titulo: "Modelo OSI e TCP/IP",
    conteudo: `**Modelo OSI (7 camadas)**:\n1. Física — transmissão de bits\n2. Enlace — frames, MAC address\n3. Rede — roteamento, IP\n4. Transporte — TCP/UDP, portas\n5. Sessão — controle de sessões\n6. Apresentação — criptografia, compressão\n7. Aplicação — HTTP, FTP, DNS\n\n**Modelo TCP/IP (4 camadas)**:\n1. Acesso à Rede\n2. Internet (IP)\n3. Transporte (TCP/UDP)\n4. Aplicação\n\n**TCP vs UDP**: TCP é confiável e orientado a conexão. UDP é mais rápido mas sem garantia de entrega.`,
    tags: ["OSI", "TCP/IP", "protocolos"],
  },
  {
    id: "r4",
    materia: "Engenharia de Software",
    titulo: "Metodologias Ágeis",
    conteudo: `**Scrum**: Framework ágil com sprints (1-4 semanas), daily standups, product backlog, sprint review e retrospectiva. Papéis: Product Owner, Scrum Master, Dev Team.\n\n**Kanban**: Visualização do fluxo de trabalho com colunas (To Do, Doing, Done). Foco em limitar WIP (Work In Progress).\n\n**XP (Extreme Programming)**: Práticas como pair programming, TDD (Test-Driven Development), integração contínua e refatoração.\n\n**Manifesto Ágil**: Indivíduos > processos, Software funcionando > documentação, Colaboração > negociação, Resposta a mudanças > seguir um plano.`,
    tags: ["scrum", "kanban", "ágil"],
  },
  {
    id: "r5",
    materia: "Estrutura de Dados",
    titulo: "Estruturas Fundamentais",
    conteudo: `**Arrays**: Coleção de elementos do mesmo tipo, acesso por índice O(1).\n\n**Listas Ligadas**: Nós conectados por ponteiros. Inserção/remoção O(1) no início.\n\n**Pilhas (Stack)**: LIFO — Last In, First Out. Operações: push, pop, peek.\n\n**Filas (Queue)**: FIFO — First In, First Out. Operações: enqueue, dequeue.\n\n**Árvores Binárias**: Cada nó tem no máximo 2 filhos. BST permite busca O(log n).\n\n**Tabelas Hash**: Mapeamento chave-valor com função hash. Acesso médio O(1).`,
    tags: ["arrays", "pilhas", "filas", "árvores"],
  },
  {
    id: "r6",
    materia: "Sistemas Operacionais",
    titulo: "Processos e Threads",
    conteudo: `**Processo**: Programa em execução com espaço de memória próprio. Estados: Novo, Pronto, Executando, Bloqueado, Terminado.\n\n**Thread**: Unidade leve de execução dentro de um processo. Threads compartilham memória do processo.\n\n**Escalonamento**: Algoritmos que decidem qual processo executa. Exemplos: FCFS, SJF, Round Robin, Prioridade.\n\n**Deadlock**: Situação onde processos ficam esperando recursos mutuamente. Condições: Exclusão mútua, Posse e espera, Não preempção, Espera circular.`,
    tags: ["processos", "threads", "escalonamento", "deadlock"],
  },
];
