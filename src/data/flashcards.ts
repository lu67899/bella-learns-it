export interface Flashcard {
  id: string;
  materia: string;
  pergunta: string;
  resposta: string;
  isCustom?: boolean;
}

export interface QuizQuestion {
  id: string;
  materia: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
}

export const flashcardsIniciais: Flashcard[] = [
  { id: "f1", materia: "Programação", pergunta: "Quais são os 4 pilares da POO?", resposta: "Encapsulamento, Herança, Polimorfismo e Abstração." },
  { id: "f2", materia: "Programação", pergunta: "O que é uma variável?", resposta: "Um espaço na memória que armazena um valor que pode ser alterado durante a execução do programa." },
  { id: "f3", materia: "Banco de Dados", pergunta: "O que é uma chave primária?", resposta: "Um atributo (ou conjunto) que identifica de forma única cada registro em uma tabela." },
  { id: "f4", materia: "Banco de Dados", pergunta: "O que é normalização?", resposta: "Processo de organizar tabelas para minimizar redundância e dependências." },
  { id: "f5", materia: "Redes de Computadores", pergunta: "Quantas camadas tem o modelo OSI?", resposta: "7 camadas: Física, Enlace, Rede, Transporte, Sessão, Apresentação e Aplicação." },
  { id: "f6", materia: "Redes de Computadores", pergunta: "Qual a diferença entre TCP e UDP?", resposta: "TCP é confiável e orientado a conexão. UDP é mais rápido, sem garantia de entrega." },
  { id: "f7", materia: "Engenharia de Software", pergunta: "O que é Scrum?", resposta: "Framework ágil baseado em sprints, com papéis definidos (PO, SM, Dev Team) e cerimônias." },
  { id: "f8", materia: "Estrutura de Dados", pergunta: "O que é uma pilha (stack)?", resposta: "Estrutura LIFO (Last In, First Out). O último elemento inserido é o primeiro a ser removido." },
  { id: "f9", materia: "Sistemas Operacionais", pergunta: "O que é deadlock?", resposta: "Situação onde dois ou mais processos ficam esperando recursos mutuamente, sem poder continuar." },
  { id: "f10", materia: "Estrutura de Dados", pergunta: "Qual a complexidade de busca em uma BST balanceada?", resposta: "O(log n) — busca binária na árvore." },
];

export const quizQuestionsIniciais: QuizQuestion[] = [
  { id: "q1", materia: "Programação", pergunta: "Qual paradigma organiza código em objetos com atributos e métodos?", opcoes: ["Funcional", "Imperativo", "Orientado a Objetos", "Declarativo"], correta: 2 },
  { id: "q2", materia: "Banco de Dados", pergunta: "Qual comando SQL é usado para consultar dados?", opcoes: ["INSERT", "UPDATE", "DELETE", "SELECT"], correta: 3 },
  { id: "q3", materia: "Redes de Computadores", pergunta: "Qual camada do modelo OSI é responsável pelo roteamento?", opcoes: ["Transporte", "Rede", "Enlace", "Aplicação"], correta: 1 },
  { id: "q4", materia: "Engenharia de Software", pergunta: "Qual metodologia usa sprints de 1-4 semanas?", opcoes: ["Kanban", "Waterfall", "Scrum", "XP"], correta: 2 },
  { id: "q5", materia: "Estrutura de Dados", pergunta: "Qual estrutura segue o princípio FIFO?", opcoes: ["Pilha", "Fila", "Árvore", "Hash"], correta: 1 },
  { id: "q6", materia: "Sistemas Operacionais", pergunta: "Qual algoritmo de escalonamento dá um tempo fixo para cada processo?", opcoes: ["FCFS", "SJF", "Round Robin", "Prioridade"], correta: 2 },
];
