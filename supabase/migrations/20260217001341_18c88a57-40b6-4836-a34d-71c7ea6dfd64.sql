
-- Módulo 1: Fundamentos de SI
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000001', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Fundamentos de Sistemas de Informação', 'O que são SI, tipos, componentes e importância nas organizações', 'BookOpen', 2);

-- Tópicos do Módulo 1
INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000001', 'O que é um Sistema de Informação?', '## O que é um Sistema de Informação?

Imagine que você está numa empresa. Todo dia chegam **dados** de todos os lados: vendas, clientes, estoque, funcionários. Sem organização, isso vira um caos, certo?

Um **Sistema de Informação (SI)** é justamente o conjunto organizado de **pessoas, processos e tecnologia** que transforma esses dados brutos em **informações úteis** para tomar decisões.

### Os 3 pilares de um SI

| Pilar | O que faz | Exemplo |
|-------|-----------|---------|
| **Pessoas** | Usam e alimentam o sistema | Funcionários, gestores |
| **Processos** | Regras de como os dados fluem | Fluxo de aprovação de compras |
| **Tecnologia** | Hardware e software | Computadores, ERPs, bancos de dados |

### Dado vs. Informação vs. Conhecimento

Pense assim:
- **Dado**: "42" — sozinho não diz nada
- **Informação**: "42 vendas hoje" — agora tem contexto!
- **Conhecimento**: "42 vendas é 30% acima da média, então a promoção funcionou" — agora você pode agir!

### Por que SI é importante?

1. **Agiliza decisões** — em vez de procurar em papéis, a informação está na tela
2. **Reduz erros** — cálculos automáticos, validações
3. **Integra setores** — vendas, estoque e financeiro conversam entre si
4. **Cria vantagem competitiva** — quem tem informação melhor, decide melhor

> 💡 **Resumo**: SI = Pessoas + Processos + Tecnologia trabalhando juntos para transformar dados em decisões inteligentes.', 1, 5),

('a1000001-0000-0000-0000-000000000001', 'Tipos de Sistemas de Informação', '## Tipos de Sistemas de Informação

Não existe apenas "um tipo" de SI. Cada nível da empresa precisa de informações diferentes. Veja os principais:

### 1. 🖥️ SPT — Sistema de Processamento de Transações
**Para quem?** Nível operacional (dia a dia)

Registra as transações rotineiras: vendas, pagamentos, controle de ponto.

**Exemplo**: Quando você passa um produto no caixa do supermercado, o SPT registra a venda, atualiza o estoque e emite a nota fiscal.

### 2. 📊 SIG — Sistema de Informações Gerenciais
**Para quem?** Gerentes (nível tático)

Pega os dados do SPT e transforma em **relatórios** para gestores tomarem decisões.

**Exemplo**: Relatório mensal mostrando "vendas por região" ou "produtos mais vendidos".

### 3. 🎯 SAD — Sistema de Apoio à Decisão
**Para quem?** Gestores que precisam decidir coisas complexas

Permite fazer simulações e análises do tipo "e se...?"

**Exemplo**: "E se aumentarmos o preço em 10%? Quanto perdemos de clientes?"

### 4. 🏢 SIE — Sistema de Informações Executivas
**Para quem?** Diretores e presidentes (nível estratégico)

Visão geral da empresa com **painéis visuais (dashboards)** simples e diretos.

**Exemplo**: Dashboard mostrando faturamento, market share e indicadores-chave.

### Resumo Visual

```
Estratégico  →  SIE  (visão geral, dashboards)
Tático       →  SIG / SAD  (relatórios, simulações)
Operacional  →  SPT  (transações do dia a dia)
```

> 💡 Cada tipo atende um nível diferente. Na prática, todos se complementam!', 2, 5),

('a1000001-0000-0000-0000-000000000001', 'Componentes e Infraestrutura de TI', '## Componentes e Infraestrutura de TI

Para um SI funcionar, precisa de uma **infraestrutura** por trás. Pense na infraestrutura como o "esqueleto" que sustenta tudo.

### Os 5 componentes principais

#### 1. 💻 Hardware
A parte física: servidores, computadores, celulares, impressoras, cabos de rede.

**Analogia**: É como o corpo de um carro — a estrutura física.

#### 2. 🧩 Software
Os programas que rodam no hardware: sistema operacional, aplicativos, ERPs.

- **Software de sistema**: Windows, Linux
- **Software de aplicação**: Excel, SAP, sistemas web

**Analogia**: É o motorista que controla o carro.

#### 3. 🗄️ Banco de Dados
Onde os dados ficam armazenados de forma organizada. Usa-se SQL para consultar.

**Exemplo**: Tabela de clientes com nome, CPF, telefone — tudo organizado e pesquisável.

#### 4. 🌐 Redes e Telecomunicações
A conexão entre tudo: internet, Wi-Fi, VPN, cloud.

- **LAN**: rede local (escritório)
- **WAN**: rede ampla (entre cidades)
- **Cloud**: servidores na nuvem (AWS, Google Cloud)

#### 5. 👥 Pessoas e Procedimentos
Quem opera, mantém e usa o sistema. Inclui políticas de uso e segurança.

### Tendências atuais

| Tendência | O que é |
|-----------|---------|
| **Cloud Computing** | Servidores na nuvem, paga pelo que usa |
| **SaaS** | Software como serviço (ex: Google Docs) |
| **IoT** | Objetos conectados à internet (sensores) |
| **Edge Computing** | Processamento perto de onde o dado é gerado |

> 💡 A infraestrutura moderna é cada vez mais na nuvem, flexível e escalável.', 3, 5);

-- Módulo 2: Engenharia de Software
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000002', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Engenharia de Software', 'Ciclo de vida, metodologias ágeis, requisitos e qualidade de software', 'Code', 3);

INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000002', 'Ciclo de Vida do Software', '## Ciclo de Vida do Software

Todo software nasce, cresce, é mantido e eventualmente morre (é substituído). Esse caminho é o **ciclo de vida**.

### Modelo Cascata (Waterfall)

O modelo mais clássico. Cada fase só começa quando a anterior termina:

```
Requisitos → Análise → Projeto → Implementação → Testes → Manutenção
```

**Analogia**: É como construir uma casa — você não levanta paredes antes de ter a planta pronta.

✅ **Vantagem**: Bem documentado, fácil de gerenciar
❌ **Desvantagem**: Pouco flexível — se o cliente mudar de ideia, é caro voltar atrás

### Modelo Iterativo/Incremental

Em vez de fazer tudo de uma vez, entrega pedaços funcionais:

- **Iteração 1**: Login e cadastro
- **Iteração 2**: Dashboard
- **Iteração 3**: Relatórios

**Analogia**: É como montar um quebra-cabeça — vai encaixando peças e o resultado aparece aos poucos.

### Modelo Espiral

Combina iterações com **análise de riscos**. Cada volta da espiral passa por: planejamento → análise de risco → desenvolvimento → avaliação.

Ideal para projetos grandes e complexos (ex: sistemas bancários).

### Qual modelo usar?

| Situação | Modelo recomendado |
|----------|-------------------|
| Requisitos claros e fixos | Cascata |
| Requisitos podem mudar | Iterativo |
| Projeto grande e arriscado | Espiral |
| Startup, MVP | Ágil (próximo tópico!) |

> 💡 Na prática moderna, quase todo mundo usa alguma forma de desenvolvimento ágil.', 1, 5),

('a1000001-0000-0000-0000-000000000002', 'Metodologias Ágeis: Scrum e Kanban', '## Metodologias Ágeis

Em 2001, um grupo de desenvolvedores criou o **Manifesto Ágil**, que mudou a forma de fazer software:

### Os 4 valores do Manifesto Ágil

1. **Indivíduos e interações** > processos e ferramentas
2. **Software funcionando** > documentação abrangente
3. **Colaboração com o cliente** > negociação de contratos
4. **Responder a mudanças** > seguir um plano rígido

### 🏃 Scrum

O framework ágil mais usado no mundo.

**Papéis:**
- **Product Owner (PO)**: define O QUE fazer (prioridades)
- **Scrum Master**: remove obstáculos, facilita o processo
- **Time de Desenvolvimento**: FAZ o trabalho

**Cerimônias (eventos):**
- **Sprint Planning**: planeja o que será feito na sprint (2-4 semanas)
- **Daily Standup**: reunião diária de 15min — "O que fiz? O que vou fazer? Tem impedimento?"
- **Sprint Review**: mostra o que foi feito ao cliente
- **Sprint Retrospectiva**: "O que melhorar pro próximo sprint?"

**Artefatos:**
- **Product Backlog**: lista de tudo que precisa ser feito
- **Sprint Backlog**: o que vai ser feito NESSA sprint
- **Incremento**: o pedaço funcional entregue

### 📋 Kanban

Mais simples que Scrum. Usa um quadro visual com colunas:

```
A Fazer  |  Fazendo  |  Revisão  |  Feito
---------|-----------|-----------|-------
Task A   |  Task B   |  Task C   |  Task D
```

**Regra de ouro**: Limite de WIP (Work In Progress) — não acumule tarefas no "Fazendo".

### Scrum vs Kanban

| Aspecto | Scrum | Kanban |
|---------|-------|--------|
| Iterações | Sprints fixas | Fluxo contínuo |
| Papéis | PO, SM, Time | Não exige papéis fixos |
| Mudanças | No próximo sprint | A qualquer momento |
| Ideal para | Projetos com entregas regulares | Suporte, manutenção |

> 💡 Muitas equipes usam **Scrumban** — uma mistura dos dois!', 2, 5),

('a1000001-0000-0000-0000-000000000002', 'Requisitos de Software', '## Requisitos de Software

Antes de programar qualquer coisa, você precisa saber **O QUE** o sistema deve fazer. Isso é a engenharia de requisitos.

### Tipos de Requisitos

#### Requisitos Funcionais (RF)
**O que o sistema FAZ.** São as funcionalidades.

Exemplos:
- RF01: O sistema deve permitir cadastro de usuários
- RF02: O sistema deve gerar relatórios em PDF
- RF03: O sistema deve enviar e-mail de confirmação

#### Requisitos Não-Funcionais (RNF)
**COMO o sistema deve funcionar.** São as qualidades.

Exemplos:
- RNF01: O sistema deve responder em menos de 2 segundos
- RNF02: O sistema deve suportar 10.000 usuários simultâneos
- RNF03: O sistema deve funcionar em Chrome, Firefox e Safari

#### Regras de Negócio (RN)
**Políticas e restrições do negócio.**

Exemplo:
- RN01: Desconto máximo de 15% sem aprovação do gerente
- RN02: Cliente menor de 18 anos não pode fazer compra

### Técnicas de Levantamento

| Técnica | Quando usar |
|---------|-------------|
| **Entrevista** | Poucos stakeholders, detalhes profundos |
| **Questionário** | Muitas pessoas, dados quantitativos |
| **Observação** | Entender o dia a dia real |
| **Prototipação** | Cliente não sabe explicar o que quer |
| **Brainstorming** | Gerar ideias criativas |

### Documento de Requisitos

Um bom requisito é **SMART**:
- **S**pecific (específico)
- **M**easurable (mensurável)
- **A**chievable (alcançável)
- **R**elevant (relevante)
- **T**ime-bound (com prazo)

> 💡 Requisitos mal definidos são a principal causa de fracasso em projetos de software!', 3, 5);

-- Módulo 3: Redes de Computadores
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000003', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Redes de Computadores', 'Protocolos, modelo OSI/TCP-IP, segurança e infraestrutura de rede', 'Wifi', 4);

INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000003', 'Modelo OSI e TCP/IP', '## Modelo OSI e TCP/IP

Quando dois computadores conversam pela internet, a mensagem passa por várias "camadas". Existem dois modelos que explicam isso:

### 🏗️ Modelo OSI (7 camadas)

Modelo teórico/educacional criado pela ISO:

| # | Camada | O que faz | Analogia |
|---|--------|-----------|----------|
| 7 | **Aplicação** | Interface com o usuário | A carta que você escreve |
| 6 | **Apresentação** | Formatação, criptografia | Traduzir a carta pro idioma do destinatário |
| 5 | **Sessão** | Mantém a conexão aberta | A ligação telefônica |
| 4 | **Transporte** | Entrega confiável (TCP/UDP) | O serviço dos Correios (registrado ou simples) |
| 3 | **Rede** | Endereçamento e roteamento (IP) | O endereço na carta |
| 2 | **Enlace** | Comunicação entre dispositivos próximos | O carteiro do seu bairro |
| 1 | **Física** | Bits no cabo/Wi-Fi | A estrada por onde o carteiro anda |

### 🌐 Modelo TCP/IP (4 camadas)

O modelo usado **na prática** na internet:

| Camada TCP/IP | Equivalente OSI | Protocolos |
|---------------|-----------------|------------|
| **Aplicação** | 7, 6, 5 | HTTP, HTTPS, DNS, SMTP, FTP |
| **Transporte** | 4 | TCP, UDP |
| **Internet** | 3 | IP, ICMP, ARP |
| **Acesso à Rede** | 2, 1 | Ethernet, Wi-Fi |

### TCP vs UDP

| Característica | TCP | UDP |
|---------------|-----|-----|
| Confiável? | Sim (confirma entrega) | Não |
| Ordenado? | Sim | Não |
| Mais rápido? | Não | Sim |
| Uso típico | Sites, e-mail, arquivos | Streaming, jogos, VoIP |

**Analogia**: TCP é como carta registrada (você sabe que chegou). UDP é como jogar um avião de papel — mais rápido, mas sem garantia.

> 💡 Quando você acessa um site, usa TCP (porta 80/443). Quando assiste live, usa UDP.', 1, 5),

('a1000001-0000-0000-0000-000000000003', 'Endereçamento IP e Sub-redes', '## Endereçamento IP e Sub-redes

Todo dispositivo na rede precisa de um **endereço IP** — é como o CEP da internet.

### IPv4

Formato: **4 números de 0 a 255**, separados por pontos.

Exemplo: `192.168.1.100`

Cada número ocupa 8 bits → total de **32 bits**.

### Classes de IP (conceito clássico)

| Classe | Faixa | Uso |
|--------|-------|-----|
| A | 1.0.0.0 a 126.x.x.x | Grandes redes |
| B | 128.0.0.0 a 191.x.x.x | Redes médias |
| C | 192.0.0.0 a 223.x.x.x | Redes pequenas |

### IPs Privados vs Públicos

**Privados** (usados dentro da sua rede local):
- `10.0.0.0` a `10.255.255.255`
- `172.16.0.0` a `172.31.255.255`
- `192.168.0.0` a `192.168.255.255`

**Públicos**: são os IPs "reais" na internet. Seu roteador tem um IP público; seus dispositivos, IPs privados.

### Máscara de Sub-rede

Define qual parte do IP é a **rede** e qual é o **host** (dispositivo).

Exemplo:
- IP: `192.168.1.100`
- Máscara: `255.255.255.0` (ou /24)
- Rede: `192.168.1.0`
- Host: `.100`

**Analogia**: O CEP identifica o bairro (rede), e o número da casa identifica você (host).

### CIDR (notação moderna)

Em vez de classes, usamos notação /XX:
- `/24` = 256 endereços (254 utilizáveis)
- `/16` = 65.536 endereços
- `/8` = 16 milhões de endereços

### IPv6

Como os IPs v4 estão acabando, surgiu o IPv6:
- **128 bits** (vs 32 do IPv4)
- Formato: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
- Quantidade: 340 undecilhões de endereços (praticamente infinito!)

> 💡 Seu roteador de casa usa NAT para compartilhar 1 IP público entre vários dispositivos privados.', 2, 5),

('a1000001-0000-0000-0000-000000000003', 'Segurança de Redes', '## Segurança de Redes

A segurança protege a **confidencialidade, integridade e disponibilidade** (tríade CIA) das informações.

### A Tríade CIA

- **Confidencialidade**: só quem deve ver, vê (criptografia, controle de acesso)
- **Integridade**: dados não foram alterados indevidamente (hashing, checksums)
- **Disponibilidade**: o sistema está no ar quando precisa (redundância, backup)

### Principais Ameaças

| Ameaça | O que é | Prevenção |
|--------|---------|-----------|
| **Phishing** | E-mail/site falso que rouba dados | Treinamento, verificar URLs |
| **Malware** | Vírus, ransomware, trojan | Antivírus, updates |
| **DDoS** | Sobrecarrega o servidor com requisições | Firewall, CDN, rate limiting |
| **Man-in-the-Middle** | Intercepta comunicação | HTTPS, VPN |
| **SQL Injection** | Injeta código malicioso via formulários | Prepared statements, validação |
| **Engenharia Social** | Manipula pessoas para obter acesso | Treinamento, políticas |

### Ferramentas de Proteção

#### 🔥 Firewall
Filtra o tráfego de rede — decide o que entra e o que sai.

**Analogia**: É o porteiro do prédio — verifica quem pode entrar.

#### 🔐 Criptografia
- **Simétrica**: mesma chave pra cifrar e decifrar (AES) — rápida
- **Assimétrica**: chave pública + chave privada (RSA) — mais segura
- **HTTPS**: usa ambas! Assimétrica pra trocar chaves, simétrica pra transmitir dados

#### 🛡️ VPN
Cria um "túnel" criptografado na internet pública. Útil para acesso remoto seguro.

#### 📋 IDS/IPS
- **IDS** (Intrusion Detection): detecta ataques e avisa
- **IPS** (Intrusion Prevention): detecta E bloqueia

> 💡 Segurança não é um produto, é um processo contínuo. A maior vulnerabilidade é sempre o fator humano!', 3, 5);

-- Módulo 4: Banco de Dados (avançado)
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000004', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Banco de Dados Avançado', 'Modelagem, normalização, SQL e NoSQL', 'Database', 5);

INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000004', 'Modelagem de Dados e MER', '## Modelagem de Dados

Antes de criar tabelas, você precisa **modelar** — ou seja, desenhar a estrutura dos dados.

### MER — Modelo Entidade-Relacionamento

É o "mapa" do banco de dados. Tem 3 elementos:

#### 1. Entidades
São as "coisas" do mundo real que queremos armazenar.

Exemplos: **Cliente**, **Produto**, **Pedido**

#### 2. Atributos
São as características de cada entidade.

Exemplo: Cliente tem **nome**, **CPF**, **e-mail**, **telefone**

Tipos especiais:
- **Chave primária (PK)**: identifica unicamente (ex: CPF)
- **Chave estrangeira (FK)**: referência a outra tabela
- **Atributo multivalorado**: pode ter vários valores (ex: telefones)

#### 3. Relacionamentos
Como as entidades se conectam.

**Cardinalidades:**
- **1:1** — Um marido tem uma esposa (monogamia 😄)
- **1:N** — Um professor leciona várias turmas
- **N:M** — Alunos cursam várias disciplinas, e cada disciplina tem vários alunos

### Exemplo Prático

```
[CLIENTE] 1 ——— N [PEDIDO] N ——— M [PRODUTO]
   |                  |                |
  nome               data            nome
  CPF               total            preço
  email             status           estoque
```

Um cliente faz vários pedidos. Cada pedido pode ter vários produtos. E cada produto pode estar em vários pedidos.

### Do MER para tabelas

A relação N:M vira uma **tabela intermediária**:

- `clientes` (id, nome, cpf, email)
- `pedidos` (id, cliente_id, data, total)
- `produtos` (id, nome, preco, estoque)
- `pedido_produtos` (pedido_id, produto_id, quantidade)

> 💡 Sempre modele antes de criar tabelas. Um bom modelo evita 90% dos problemas futuros!', 1, 5),

('a1000001-0000-0000-0000-000000000004', 'Normalização de Dados', '## Normalização de Dados

Normalização é o processo de **organizar** as tabelas para evitar **redundância** e **anomalias**.

### O problema sem normalização

Imagine uma tabela assim:

| Pedido | Cliente | Cidade | Produto | Preço |
|--------|---------|--------|---------|-------|
| 001 | João | SP | Notebook | 3000 |
| 001 | João | SP | Mouse | 50 |
| 002 | Maria | RJ | Notebook | 3000 |

**Problemas:**
- "João" e "SP" aparecem repetidos (redundância)
- Se João mudar de cidade, tem que atualizar em vários lugares
- Se deletar o pedido 002, perdemos os dados da Maria

### As Formas Normais

#### 1ª Forma Normal (1FN)
**Regra**: Cada célula deve ter um valor atômico (único). Sem listas!

❌ Errado: telefones = "11-999, 11-888"
✅ Certo: uma linha pra cada telefone, ou tabela separada

#### 2ª Forma Normal (2FN)
**Regra**: Estar em 1FN + todo atributo não-chave deve depender da **chave inteira**.

Se a chave é (pedido_id, produto_id), o nome do cliente não depende do produto — então vai pra outra tabela.

#### 3ª Forma Normal (3FN)
**Regra**: Estar em 2FN + nenhum atributo não-chave depende de outro atributo não-chave.

Exemplo: se a tabela tem "cidade" e "estado", o estado depende da cidade, não da chave. Solução: tabela de cidades.

### Resultado da normalização

```
clientes (id, nome)
enderecos (id, cliente_id, cidade, estado)
pedidos (id, cliente_id, data)
pedido_itens (pedido_id, produto_id, quantidade)
produtos (id, nome, preco)
```

### Desnormalização

Às vezes, por **performance**, voltamos a juntar dados (desnormalizar). Isso é comum em:
- Data Warehouses (relatórios)
- Caches
- Sistemas de leitura intensiva

> 💡 Normalize primeiro, desnormalize depois se necessário. Nunca o contrário!', 2, 5),

('a1000001-0000-0000-0000-000000000004', 'SQL Essencial', '## SQL Essencial

**SQL** (Structured Query Language) é a linguagem universal dos bancos de dados relacionais.

### Tipos de comandos

| Tipo | Sigla | Comandos | O que faz |
|------|-------|----------|-----------|
| Definição | DDL | CREATE, ALTER, DROP | Estrutura das tabelas |
| Manipulação | DML | SELECT, INSERT, UPDATE, DELETE | Dados nas tabelas |
| Controle | DCL | GRANT, REVOKE | Permissões |

### SELECT — Consultar dados

```sql
-- Todos os clientes
SELECT * FROM clientes;

-- Apenas nome e email
SELECT nome, email FROM clientes;

-- Com filtro
SELECT * FROM clientes WHERE cidade = ''SP'';

-- Ordenado
SELECT * FROM produtos ORDER BY preco DESC;

-- Top 5 mais caros
SELECT * FROM produtos ORDER BY preco DESC LIMIT 5;
```

### INSERT — Inserir dados

```sql
INSERT INTO clientes (nome, email, cidade)
VALUES (''João Silva'', ''joao@email.com'', ''São Paulo'');
```

### UPDATE — Atualizar dados

```sql
UPDATE clientes
SET cidade = ''Rio de Janeiro''
WHERE id = 1;
```

### DELETE — Remover dados

```sql
DELETE FROM clientes WHERE id = 1;
```

### JOIN — Juntar tabelas

```sql
-- Pedidos com nome do cliente
SELECT p.id, c.nome, p.total
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id;
```

**Tipos de JOIN:**
- **INNER JOIN**: só retorna correspondências
- **LEFT JOIN**: todos da esquerda + correspondências
- **RIGHT JOIN**: todos da direita + correspondências

### Funções de Agregação

```sql
SELECT COUNT(*) FROM pedidos;           -- quantos pedidos
SELECT SUM(total) FROM pedidos;         -- soma total
SELECT AVG(preco) FROM produtos;        -- preço médio
SELECT MAX(preco) FROM produtos;        -- mais caro
SELECT cidade, COUNT(*) FROM clientes GROUP BY cidade;  -- por cidade
```

> 💡 SQL é a habilidade mais valiosa para quem trabalha com dados. Pratique!', 3, 5);

-- Módulo 5: Gestão de Projetos de TI
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000005', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Gestão de Projetos de TI', 'PMBOK, metodologias, riscos e indicadores', 'Target', 6);

INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000005', 'Fundamentos de Gestão de Projetos', '## Fundamentos de Gestão de Projetos

### O que é um projeto?

Um projeto é um esforço **temporário** para criar algo **único**.

- **Temporário**: tem início e fim definidos
- **Único**: o resultado nunca foi feito exatamente igual antes

**Exemplos**: Criar um app, construir uma ponte, organizar um evento.

**Não é projeto**: Atividades rotineiras como folha de pagamento mensal.

### O Triângulo de Ferro

Todo projeto equilibra 3 restrições:

```
        Escopo
       /      \
      /        \
   Tempo ---- Custo
```

**Regra**: Se mudar um, pelo menos outro muda também.
- Quer mais funcionalidades (escopo)? Vai demorar mais (tempo) ou custar mais (custo).
- Quer mais rápido? Reduz escopo ou aumenta custo.

### PMBOK — O guia de referência

O **PMBOK** (Project Management Body of Knowledge) do PMI organiza a gestão em **10 áreas de conhecimento**:

1. **Integração** — visão geral do projeto
2. **Escopo** — o que está incluído (e o que NÃO está)
3. **Cronograma** — quando cada coisa será feita
4. **Custos** — orçamento
5. **Qualidade** — padrões e testes
6. **Recursos** — pessoas e materiais
7. **Comunicação** — quem precisa saber o quê
8. **Riscos** — o que pode dar errado
9. **Aquisições** — compras e contratos
10. **Stakeholders** — todas as pessoas envolvidas/afetadas

### Fases de um Projeto

```
Iniciação → Planejamento → Execução → Monitoramento → Encerramento
```

> 💡 Um projeto sem planejamento é só uma boa intenção. Planeje antes de executar!', 1, 5),

('a1000001-0000-0000-0000-000000000005', 'Gestão de Riscos em TI', '## Gestão de Riscos em TI

**Risco** = evento incerto que, se acontecer, afeta o projeto (positiva ou negativamente).

### Processo de Gestão de Riscos

#### 1. Identificar riscos
Liste tudo que pode dar errado (e certo!).

**Técnicas:**
- Brainstorming com a equipe
- Análise de projetos anteriores
- Checklist de riscos comuns
- Entrevistas com especialistas

#### 2. Analisar riscos

**Análise qualitativa** — classifica por probabilidade × impacto:

| | Impacto Baixo | Impacto Médio | Impacto Alto |
|---|---|---|---|
| **Prob. Alta** | 🟡 Médio | 🟠 Alto | 🔴 Crítico |
| **Prob. Média** | 🟢 Baixo | 🟡 Médio | 🟠 Alto |
| **Prob. Baixa** | 🟢 Baixo | 🟢 Baixo | 🟡 Médio |

#### 3. Planejar respostas

| Estratégia | O que faz | Exemplo |
|------------|-----------|---------|
| **Evitar** | Elimina a causa | Trocar tecnologia instável |
| **Mitigar** | Reduz probabilidade/impacto | Fazer backup diário |
| **Transferir** | Passa pra outro | Contratar seguro, terceirizar |
| **Aceitar** | Convive com o risco | Reservar verba de contingência |

#### 4. Monitorar

Acompanhe continuamente. Riscos mudam ao longo do projeto!

### Riscos comuns em projetos de TI

| Risco | Consequência |
|-------|-------------|
| Requisitos mal definidos | Retrabalho, atrasos |
| Saída de membro-chave | Perda de conhecimento |
| Tecnologia nova sem experiência | Bugs, atrasos |
| Subestimar complexidade | Estouro de prazo/custo |
| Falta de testes | Bugs em produção |

> 💡 Gerenciar riscos não é ser pessimista — é ser realista e estar preparado!', 2, 5);

-- Módulo 6: Governança e Ética em TI
INSERT INTO public.modulos (id, curso_id, nome, descricao, icone, ordem) VALUES
('a1000001-0000-0000-0000-000000000006', 'ed94af86-e97e-424b-9338-879f6dce721a', 'Governança e Ética em TI', 'LGPD, governança de TI, ética digital e frameworks', 'Scale', 7);

INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
('a1000001-0000-0000-0000-000000000006', 'Governança de TI: ITIL e COBIT', '## Governança de TI

**Governança de TI** garante que a tecnologia esteja alinhada com os objetivos do negócio. Não basta ter TI boa — ela precisa gerar **valor**.

### 📘 ITIL (Information Technology Infrastructure Library)

Framework de **boas práticas** para gerenciar serviços de TI.

**Conceito central**: TI é um **serviço** para o negócio.

**Ciclo de vida do serviço (ITIL v3):**

1. **Estratégia de Serviço** — define quais serviços oferecer
2. **Desenho de Serviço** — projeta como entregar
3. **Transição de Serviço** — implementa mudanças
4. **Operação de Serviço** — dia a dia, suporte
5. **Melhoria Contínua** — sempre melhorando

**Processos mais importantes:**
- **Gerenciamento de Incidentes**: restaurar o serviço o mais rápido possível
- **Gerenciamento de Problemas**: encontrar a causa raiz
- **Gerenciamento de Mudanças**: controlar alterações no ambiente
- **Service Desk**: ponto único de contato com o usuário

### 📗 COBIT (Control Objectives for Information Technologies)

Framework de **governança** — mais estratégico que ITIL.

**5 Princípios do COBIT 5:**
1. Atender necessidades dos stakeholders
2. Cobrir a organização fim a fim
3. Aplicar um framework integrado
4. Permitir uma abordagem holística
5. Separar governança de gestão

**Diferença importante:**
- **Governança**: DIRECIONA (o quê fazer) — responsabilidade do conselho/diretoria
- **Gestão**: EXECUTA (como fazer) — responsabilidade dos gerentes

### ITIL vs COBIT

| Aspecto | ITIL | COBIT |
|---------|------|-------|
| Foco | Operacional (serviços) | Estratégico (governança) |
| Pergunta | "Como entregar bem?" | "Estamos fazendo a coisa certa?" |
| Quem usa | Equipe de TI | Diretoria, auditoria |

> 💡 ITIL e COBIT não competem — se complementam! COBIT diz O QUE governar, ITIL diz COMO operar.', 1, 5),

('a1000001-0000-0000-0000-000000000006', 'LGPD e Proteção de Dados', '## LGPD — Lei Geral de Proteção de Dados

A **LGPD** (Lei 13.709/2018) é a lei brasileira que regula como empresas e organizações coletam, armazenam e usam **dados pessoais**.

### Conceitos fundamentais

| Termo | Significado | Exemplo |
|-------|-------------|---------|
| **Dado pessoal** | Qualquer info que identifica alguém | Nome, CPF, e-mail, IP |
| **Dado sensível** | Dados delicados, proteção extra | Saúde, religião, biometria, orientação sexual |
| **Titular** | A pessoa dona dos dados | Você, eu, qualquer cidadão |
| **Controlador** | Quem decide o que fazer com os dados | A empresa que coleta |
| **Operador** | Quem processa os dados a mando do controlador | Empresa de cloud, consultoria |
| **Encarregado (DPO)** | Responsável pela proteção na empresa | Pessoa nomeada pela empresa |
| **ANPD** | Autoridade Nacional de Proteção de Dados | Órgão fiscalizador do governo |

### 10 Bases Legais (quando posso usar dados?)

As mais comuns:
1. **Consentimento** — o titular autorizou explicitamente
2. **Execução de contrato** — preciso dos dados pra cumprir um contrato
3. **Obrigação legal** — a lei exige (ex: dados fiscais)
4. **Legítimo interesse** — interesse justificável do controlador
5. **Proteção da vida** — emergência de saúde

### Direitos do Titular

A pessoa dona dos dados pode:
- ✅ Saber se seus dados são tratados
- ✅ Acessar seus dados
- ✅ Corrigir dados incompletos
- ✅ Pedir anonimização ou eliminação
- ✅ Revogar consentimento
- ✅ Solicitar portabilidade

### Penalidades

- Advertência
- Multa de até **2% do faturamento** (máximo R$ 50 milhões por infração)
- Bloqueio ou eliminação dos dados
- Publicização da infração (dano à reputação)

### Boas práticas para desenvolvedores

1. **Colete apenas o necessário** (minimização)
2. **Peça consentimento claro** (nada de checkbox pré-marcado)
3. **Criptografe dados sensíveis**
4. **Permita exclusão de conta** e dados
5. **Tenha política de privacidade** clara
6. **Registre logs de acesso** aos dados

> 💡 A LGPD não é só questão legal — é respeito ao usuário. Desenvolva com privacidade desde o início (Privacy by Design)!', 2, 5),

('a1000001-0000-0000-0000-000000000006', 'Ética na Tecnologia da Informação', '## Ética na Tecnologia da Informação

A tecnologia é uma ferramenta poderosa — e como toda ferramenta, pode ser usada para o bem ou para o mal. A ética nos guia para usar essa ferramenta da forma certa.

### Dilemas éticos comuns em TI

#### 1. 🔍 Privacidade vs. Segurança
"Devemos monitorar tudo para prevenir crimes, ou respeitar a privacidade individual?"

Exemplo: Empresa que monitora todos os e-mails dos funcionários.

#### 2. 🤖 Inteligência Artificial e Viés
Algoritmos podem reproduzir preconceitos dos dados com que foram treinados.

Exemplo: IA de recrutamento que favorece candidatos homens porque foi treinada com dados históricos.

#### 3. 🎯 Dark Patterns
Interfaces projetadas para manipular o usuário.

Exemplos:
- Botão "Cancelar assinatura" escondido
- Checkbox pré-marcado pra receber spam
- Contador falso de "restam só 2 unidades!"

#### 4. 💰 Propriedade Intelectual
Usar código, imagens ou dados sem autorização.

- **Software livre** ≠ software sem regras (tem licenças!)
- Principais licenças: MIT, GPL, Apache

### Código de Ética da ACM

A ACM (Association for Computing Machinery) define princípios para profissionais de TI:

1. **Contribuir para o bem-estar da sociedade**
2. **Evitar danos** a outros
3. **Ser honesto e confiável**
4. **Respeitar a privacidade**
5. **Manter competência profissional**
6. **Conhecer e respeitar as leis**
7. **Avaliar impactos dos sistemas** que cria

### Responsabilidade do Profissional de TI

Como desenvolvedor/analista, você é responsável por:

- 🔐 Proteger dados dos usuários
- 🧪 Testar adequadamente (bugs podem causar prejuízos reais)
- 📢 Alertar sobre riscos éticos dos sistemas
- 🤝 Ser transparente sobre capacidades e limitações
- ♿ Criar sistemas acessíveis para todos

### Tecnologia para o bem

Exemplos inspiradores:
- **Code.org**: ensinar programação para todos
- **OpenStreetMap**: mapas livres e colaborativos
- **Folding@home**: computação distribuída para pesquisa médica
- **Acessibilidade digital**: sites que todos podem usar

> 💡 A pergunta não é "podemos fazer isso?" — é "devemos fazer isso?" Ser um bom profissional de TI vai muito além de saber programar.', 3, 5);
