
DO $$
DECLARE
  v_curso_id uuid;
  v_mod1 uuid;
  v_mod2 uuid;
  v_mod3 uuid;
  v_mod4 uuid;
  v_mod5 uuid;
  v_mod6 uuid;
  v_mod7 uuid;
BEGIN
  INSERT INTO public.cursos (nome, descricao, icone, ordem)
  VALUES ('HTML', 'Curso completo de HTML nível universitário — da história da web até técnicas avançadas de semântica e acessibilidade, com linguagem simples e exemplos práticos.', 'Globe', 11)
  RETURNING id INTO v_curso_id;

  -- Módulo 1: História e Fundamentos
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'A História do HTML e da Web', 'Como a internet surgiu e por que o HTML foi criado — do CERN até os dias atuais.', 'Globe', 0)
  RETURNING id INTO v_mod1;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod1, 'O Nascimento da Web', '## O Nascimento da Web

Imagine que você tem milhares de bibliotecas espalhadas pelo mundo, mas nenhum catálogo unificado. Era assim que os cientistas do CERN (laboratório europeu de física) se sentiam nos anos 80 — toneladas de pesquisas, mas sem uma forma fácil de conectá-las.

### Tim Berners-Lee e a Solução

Em **1989**, o físico britânico **Tim Berners-Lee** propôs um sistema de **hipertexto** — documentos que se conectam uns aos outros através de links. Pense nisso como post-its colados em livros, apontando para páginas de outros livros.

Ele criou três tecnologias fundamentais:

| Tecnologia | O que faz | Analogia |
|---|---|---|
| **HTML** | Estrutura o conteúdo | A planta de uma casa |
| **HTTP** | Protocolo de transferência | O carteiro que entrega as cartas |
| **URL** | Endereço do recurso | O CEP da casa |

### A Primeira Página Web

Em **1991**, a primeira página web foi publicada. Era simples, sem cores, sem imagens — apenas texto e links. Mas revolucionou a forma como compartilhamos informação.

### A Evolução

- **HTML 1.0 (1991)**: Apenas texto e links
- **HTML 2.0 (1995)**: Formulários e tabelas básicas
- **HTML 3.2 (1997)**: Cores, fontes e alinhamento
- **HTML 4.01 (1999)**: Separação de conteúdo e estilo (CSS)
- **XHTML (2000)**: HTML mais rígido, baseado em XML
- **HTML5 (2014)**: Vídeo, áudio, canvas, semântica moderna

### Por que isso importa?

Entender a história te ajuda a compreender **por que** certas coisas existem no HTML. Tags como `<b>` e `<i>` são resquícios de uma época onde não existia CSS. Tags semânticas como `<article>` e `<nav>` são a evolução moderna.

> 💡 **Curiosidade**: Tim Berners-Lee poderia ter patenteado a web e ficado bilionário. Em vez disso, ele a tornou gratuita e aberta para todos.', 0, 5),

  (v_mod1, 'O que é HTML e como funciona', '## O que é HTML e como funciona

### A Analogia da Casa

Pense em construir uma casa:
- **HTML** = a estrutura (paredes, portas, janelas)
- **CSS** = a decoração (pintura, móveis, cortinas)
- **JavaScript** = a automação (luzes automáticas, portão eletrônico)

HTML significa **HyperText Markup Language** — Linguagem de Marcação de Hipertexto.

### O que é "Marcação"?

Marcar é como usar canetas coloridas para organizar um texto:
- Amarelo = título
- Verde = parágrafo importante
- Azul = link

No HTML, em vez de cores, usamos **tags**:

```html
<h1>Isso é um título</h1>
<p>Isso é um parágrafo</p>
<a href="https://exemplo.com">Isso é um link</a>
```

### Anatomia de uma Tag

```
<tag atributo="valor">conteúdo</tag>
 ↑         ↑            ↑       ↑
 Tag    Atributo     Conteúdo  Tag de
 de                           fechamento
 abertura
```

### Tags de Auto-fechamento

Algumas tags não precisam de conteúdo:

```html
<br>     <!-- quebra de linha -->
<hr>     <!-- linha horizontal -->
<img src="foto.jpg" alt="descrição">
```

### O Primeiro Documento HTML

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minha Primeira Página</title>
</head>
<body>
  <h1>Olá, Mundo!</h1>
  <p>Esta é minha primeira página web.</p>
</body>
</html>
```

| Elemento | Função |
|---|---|
| `<!DOCTYPE html>` | Diz ao navegador que é HTML5 |
| `<html>` | Raiz do documento |
| `<head>` | Metadados (invisíveis ao usuário) |
| `<body>` | Conteúdo visível da página |

> 🧠 **Exercício mental**: Abra qualquer site, clique com botão direito → "Ver código-fonte". Você verá HTML puro!', 1, 5);

  -- Módulo 2: Texto e Tipografia
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'Texto e Tipografia', 'Títulos, parágrafos, listas, citações e formatação de texto.', 'BookOpen', 1)
  RETURNING id INTO v_mod2;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod2, 'Títulos, Parágrafos e Quebras', '## Títulos, Parágrafos e Quebras de Linha

### Hierarquia de Títulos

Os títulos no HTML vão de `<h1>` (mais importante) a `<h6>` (menos importante). Pense neles como o índice de um livro:

```html
<h1>Livro: Aprendendo HTML</h1>         <!-- Título do livro -->
  <h2>Capítulo 1: Introdução</h2>       <!-- Capítulo -->
    <h3>1.1 O que é HTML</h3>            <!-- Seção -->
      <h4>1.1.1 História</h4>            <!-- Subseção -->
```

**Regras importantes:**
- Use apenas **um `<h1>`** por página (como um livro tem um título)
- Não pule níveis (não vá de `<h2>` direto para `<h4>`)
- Títulos são para **hierarquia**, não para tamanho de fonte

### Parágrafos

O `<p>` é o bloco básico de texto:

```html
<p>Este é o primeiro parágrafo. O navegador adiciona 
espaçamento automático entre parágrafos.</p>

<p>Este é o segundo parágrafo. Não importa quantos
espaços ou          quebras de linha você coloque
no código — o navegador ignora espaços extras.</p>
```

### Quebras de Linha e Separadores

```html
<p>Primeira linha<br>Segunda linha</p>   <!-- Quebra simples -->
<hr>                                      <!-- Linha horizontal -->
```

### Texto Pré-formatado

Quando você PRECISA que espaços sejam respeitados:

```html
<pre>
  Isso   mantém    os espaços
  e as quebras de linha
  exatamente como estão
</pre>
```

| Tag | Uso | Exemplo |
|---|---|---|
| `<h1>` a `<h6>` | Títulos hierárquicos | Capítulos, seções |
| `<p>` | Parágrafo | Texto corrido |
| `<br>` | Quebra de linha | Endereços, poemas |
| `<hr>` | Separador temático | Mudança de assunto |
| `<pre>` | Texto pré-formatado | Código, ASCII art |', 0, 5),

  (v_mod2, 'Listas e Formatação de Texto', '## Listas e Formatação de Texto

### Tipos de Listas

**1. Lista Não Ordenada** (bullets):
```html
<ul>
  <li>Café</li>
  <li>Chá</li>
  <li>Suco</li>
</ul>
```

**2. Lista Ordenada** (numerada):
```html
<ol>
  <li>Preaqueça o forno</li>
  <li>Misture os ingredientes</li>
  <li>Asse por 30 minutos</li>
</ol>
```

**3. Lista de Definição**:
```html
<dl>
  <dt>HTML</dt>
  <dd>Linguagem de marcação para estruturar páginas web</dd>
  <dt>CSS</dt>
  <dd>Linguagem de estilos para estilizar páginas web</dd>
</dl>
```

**4. Listas Aninhadas** (lista dentro de lista):
```html
<ul>
  <li>Frutas
    <ul>
      <li>Maçã</li>
      <li>Banana</li>
    </ul>
  </li>
  <li>Legumes</li>
</ul>
```

### Formatação Semântica vs. Visual

| Semântico (prefira!) | Visual (evite!) | Resultado |
|---|---|---|
| `<strong>` | `<b>` | **Negrito** |
| `<em>` | `<i>` | *Itálico* |
| `<mark>` | — | Destacado |
| `<del>` | `<s>` | ~~Riscado~~ |
| `<ins>` | `<u>` | Sublinhado |

A diferença importa! `<strong>` diz "isto é importante" (leitores de tela enfatizam). `<b>` apenas deixa visualmente em negrito.

### Citações

```html
<blockquote cite="https://...">
  <p>A web é para todos.</p>
  <footer>— Tim Berners-Lee</footer>
</blockquote>

<p>Ele disse que <q>a web é para todos</q>.</p>
```

### Código e Abreviações

```html
<p>Use <code>console.log()</code> para depurar.</p>
<p>O <abbr title="World Wide Web Consortium">W3C</abbr> define os padrões.</p>
```

> 🧠 **Dica**: Sempre prefira tags semânticas. Elas melhoram a acessibilidade e o SEO do seu site.', 1, 5);

  -- Módulo 3: Links e Mídia
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'Links, Imagens e Mídia', 'Hyperlinks, imagens, áudio, vídeo e incorporação de conteúdo externo.', 'Layers', 2)
  RETURNING id INTO v_mod3;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod3, 'Links e Navegação', '## Links e Navegação

### O Que São Hyperlinks?

Links são a **essência** da web — são eles que conectam uma página a outra. Sem links, cada página seria uma ilha isolada. É como uma teia de aranha: cada fio conecta um ponto a outro.

### A Tag `<a>` (Anchor)

```html
<a href="https://www.google.com">Ir para o Google</a>
```

| Atributo | Função | Exemplo |
|---|---|---|
| `href` | URL de destino | `"https://site.com"` |
| `target` | Onde abrir | `"_blank"` (nova aba) |
| `rel` | Relacionamento | `"noopener noreferrer"` |
| `title` | Tooltip ao passar mouse | `"Visite nosso site"` |
| `download` | Forçar download | `download="arquivo.pdf"` |

### Tipos de Links

**1. Link Absoluto** (URL completa):
```html
<a href="https://www.exemplo.com/pagina">Site externo</a>
```

**2. Link Relativo** (dentro do mesmo site):
```html
<a href="/sobre">Sobre nós</a>
<a href="../contato.html">Contato</a>
```

**3. Link para Âncora** (mesma página):
```html
<h2 id="capitulo2">Capítulo 2</h2>
<!-- ... muito conteúdo ... -->
<a href="#capitulo2">Voltar ao Capítulo 2</a>
```

**4. Link para E-mail e Telefone**:
```html
<a href="mailto:contato@site.com">Enviar e-mail</a>
<a href="tel:+5511999999999">Ligar</a>
```

### Segurança com `target="_blank"`

Sempre que abrir link em nova aba, adicione `rel`:
```html
<a href="https://externo.com" target="_blank" rel="noopener noreferrer">
  Site externo
</a>
```
Isso impede que a página externa acesse sua página via `window.opener`.

### Boas Práticas

- ✅ `<a href="...">Leia o artigo sobre HTML</a>`
- ❌ `<a href="...">Clique aqui</a>` (não é descritivo)
- Links devem fazer sentido fora de contexto (leitores de tela leem apenas os links)', 0, 5),

  (v_mod3, 'Imagens, Áudio e Vídeo', '## Imagens, Áudio e Vídeo

### Imagens com `<img>`

A tag `<img>` é de **auto-fechamento** — não tem conteúdo entre tags:

```html
<img 
  src="foto-praia.jpg" 
  alt="Praia de areia branca com mar azul ao pôr do sol"
  width="800"
  height="600"
  loading="lazy"
>
```

| Atributo | Obrigatório? | Função |
|---|---|---|
| `src` | ✅ Sim | Caminho da imagem |
| `alt` | ✅ Sim | Descrição textual (acessibilidade) |
| `width/height` | Recomendado | Evita "pulo" no layout |
| `loading="lazy"` | Recomendado | Carrega só quando visível |

### A Tag `<figure>` e `<figcaption>`

```html
<figure>
  <img src="grafico.png" alt="Gráfico de barras mostrando crescimento de 40%">
  <figcaption>Figura 1: Crescimento trimestral da empresa</figcaption>
</figure>
```

### Formatos de Imagem

| Formato | Melhor para | Transparência? |
|---|---|---|
| JPEG | Fotos | ❌ |
| PNG | Gráficos, logos | ✅ |
| WebP | Tudo (moderno) | ✅ |
| SVG | Ícones, vetores | ✅ |
| GIF | Animações simples | ✅ (1 cor) |

### Vídeo com `<video>`

```html
<video controls width="640" poster="thumbnail.jpg">
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  Seu navegador não suporta vídeo HTML5.
</video>
```

### Áudio com `<audio>`

```html
<audio controls>
  <source src="musica.mp3" type="audio/mpeg">
  <source src="musica.ogg" type="audio/ogg">
  Seu navegador não suporta áudio HTML5.
</audio>
```

### Incorporação com `<iframe>`

```html
<iframe 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  width="560" height="315"
  title="Título do vídeo"
  allowfullscreen
></iframe>
```

> ⚠️ **Importante**: O atributo `alt` não é opcional! Pessoas cegas dependem dele para entender o conteúdo das imagens.', 1, 5);

  -- Módulo 4: Tabelas e Formulários
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'Tabelas e Formulários', 'Tabelas de dados estruturados e formulários interativos com validação.', 'Database', 3)
  RETURNING id INTO v_mod4;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod4, 'Tabelas HTML', '## Tabelas HTML

### Quando Usar Tabelas?

Tabelas são para **dados tabulares** — informações que fazem sentido em linhas e colunas. Pense em uma planilha do Excel.

- ✅ Usar para: notas de alunos, preços de produtos, horários
- ❌ NÃO usar para: layout de página (isso é trabalho do CSS!)

### Estrutura Básica

```html
<table>
  <thead>
    <tr>
      <th>Nome</th>
      <th>Idade</th>
      <th>Cidade</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ana</td>
      <td>25</td>
      <td>São Paulo</td>
    </tr>
    <tr>
      <td>João</td>
      <td>30</td>
      <td>Rio de Janeiro</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="3">Total: 2 pessoas</td>
    </tr>
  </tfoot>
</table>
```

| Tag | Significado |
|---|---|
| `<table>` | Container da tabela |
| `<thead>` | Cabeçalho |
| `<tbody>` | Corpo dos dados |
| `<tfoot>` | Rodapé |
| `<tr>` | Table Row (linha) |
| `<th>` | Table Header (célula de cabeçalho) |
| `<td>` | Table Data (célula de dados) |

### Mesclando Células

```html
<!-- colspan: mescla colunas horizontalmente -->
<td colspan="2">Ocupa duas colunas</td>

<!-- rowspan: mescla linhas verticalmente -->
<td rowspan="3">Ocupa três linhas</td>
```

### Acessibilidade em Tabelas

```html
<table>
  <caption>Notas dos Alunos - 1º Semestre 2025</caption>
  <thead>
    <tr>
      <th scope="col">Aluno</th>
      <th scope="col">Nota</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Maria</th>
      <td>9.5</td>
    </tr>
  </tbody>
</table>
```

O `<caption>` é o título da tabela e `scope` ajuda leitores de tela a associar dados aos cabeçalhos corretos.

> 🧠 **Analogia**: `<thead>` é como o cabeçalho de uma planilha Excel que fica fixo quando você rola — define o que cada coluna significa.', 0, 5),

  (v_mod4, 'Formulários e Inputs', '## Formulários e Inputs

### O que são Formulários?

Formulários são a forma de **coletar dados** do usuário. Pense neles como fichas de cadastro digitais — o usuário preenche e envia.

### Estrutura Básica

```html
<form action="/enviar" method="POST">
  <label for="nome">Nome:</label>
  <input type="text" id="nome" name="nome" required>
  
  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email" required>
  
  <button type="submit">Enviar</button>
</form>
```

### Tipos de Input

| type | Aparência | Uso |
|---|---|---|
| `text` | Campo de texto | Nome, cidade |
| `email` | Campo com validação de e-mail | E-mail |
| `password` | Campo com asteriscos | Senha |
| `number` | Campo numérico com setas | Idade, quantidade |
| `tel` | Teclado numérico (mobile) | Telefone |
| `url` | Campo com validação de URL | Website |
| `date` | Seletor de data | Data de nascimento |
| `time` | Seletor de horário | Hora de agendamento |
| `color` | Seletor de cor | Preferência de cor |
| `range` | Slider | Volume, satisfação |
| `file` | Upload de arquivo | Foto, documento |
| `checkbox` | Caixa de seleção | Aceitar termos |
| `radio` | Botão de opção | Gênero, plano |
| `hidden` | Invisível | IDs, tokens |

### Outros Elementos de Formulário

```html
<!-- Área de texto grande -->
<textarea name="mensagem" rows="5" cols="40" 
  placeholder="Escreva sua mensagem..."></textarea>

<!-- Lista suspensa -->
<select name="estado">
  <option value="">Selecione...</option>
  <option value="SP">São Paulo</option>
  <option value="RJ">Rio de Janeiro</option>
</select>

<!-- Agrupamento -->
<fieldset>
  <legend>Endereço</legend>
  <input type="text" name="rua" placeholder="Rua">
  <input type="text" name="cidade" placeholder="Cidade">
</fieldset>
```

### Validação HTML5

```html
<input type="text" required minlength="3" maxlength="50">
<input type="number" min="0" max="100" step="5">
<input type="text" pattern="[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}" 
  title="Formato: 000.000.000-00" placeholder="CPF">
```

### Labels São Obrigatórios!

Sempre associe `<label>` aos inputs — melhora acessibilidade e a área clicável:

```html
<!-- Método 1: for/id -->
<label for="nome">Nome:</label>
<input id="nome" type="text">

<!-- Método 2: aninhamento -->
<label>
  Nome:
  <input type="text">
</label>
```

> ⚠️ **Nunca** use placeholder como substituto de label!', 1, 5);

  -- Módulo 5: HTML Semântico
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'HTML5 Semântico', 'Tags semânticas modernas, estrutura de página e boas práticas de organização.', 'Layers', 4)
  RETURNING id INTO v_mod5;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod5, 'Tags Semânticas de Estrutura', '## Tags Semânticas de Estrutura

### O Problema do "Div Hell"

Antes do HTML5, as páginas eram assim:

```html
<div id="header">...</div>
<div id="nav">...</div>
<div id="main">
  <div class="article">...</div>
  <div class="sidebar">...</div>
</div>
<div id="footer">...</div>
```

O navegador e leitores de tela não sabiam o que cada `<div>` significava. Era como um livro sem índice, sem capítulos, sem títulos — apenas blocos de texto.

### A Solução: Tags Semânticas

```html
<header>Cabeçalho do site</header>
<nav>Menu de navegação</nav>
<main>
  <article>Conteúdo principal</article>
  <aside>Barra lateral</aside>
</main>
<footer>Rodapé</footer>
```

### Mapa de Tags Semânticas

| Tag | Significado | Analogia |
|---|---|---|
| `<header>` | Cabeçalho | Capa de um livro |
| `<nav>` | Navegação | Índice do livro |
| `<main>` | Conteúdo principal | O texto do livro |
| `<article>` | Conteúdo independente | Um capítulo completo |
| `<section>` | Seção temática | Uma seção do capítulo |
| `<aside>` | Conteúdo relacionado | Notas de rodapé |
| `<footer>` | Rodapé | Contracapa do livro |
| `<figure>` | Figura com legenda | Ilustração com legenda |
| `<details>` | Conteúdo expansível | FAQ acordeão |
| `<time>` | Data/hora | Carimbo de data |
| `<address>` | Informações de contato | Ficha de contato |

### Exemplo de Página Completa

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog de Tecnologia</title>
</head>
<body>
  <header>
    <h1>TechBlog</h1>
    <nav>
      <ul>
        <li><a href="/">Início</a></li>
        <li><a href="/sobre">Sobre</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h2>HTML5: O Futuro é Semântico</h2>
        <time datetime="2025-01-15">15 de Janeiro de 2025</time>
      </header>
      <p>O HTML5 trouxe tags que dão significado...</p>
      <footer>
        <p>Escrito por <address>João Silva</address></p>
      </footer>
    </article>

    <aside>
      <h3>Artigos Relacionados</h3>
      <ul>
        <li><a href="#">CSS Grid Guide</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2025 TechBlog</p>
  </footer>
</body>
</html>
```

### Por que Semântica Importa?

1. **SEO**: Google entende melhor seu conteúdo
2. **Acessibilidade**: Leitores de tela navegam por landmarks
3. **Manutenção**: Código mais legível para desenvolvedores
4. **Futuro**: Máquinas entendem significado, não apenas aparência', 0, 5),

  (v_mod5, 'Metadados e SEO', '## Metadados e SEO

### O `<head>` — O Cérebro Invisível

O `<head>` contém informações **sobre** a página, não o conteúdo visível. É como os metadados de uma foto: data, localização, câmera — informações que não aparecem na imagem.

### Metadados Essenciais

```html
<head>
  <!-- Codificação de caracteres -->
  <meta charset="UTF-8">
  
  <!-- Responsividade -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Título da aba do navegador (crucial para SEO) -->
  <title>HTML Completo - Aprenda do Zero | TechBlog</title>
  
  <!-- Descrição para mecanismos de busca -->
  <meta name="description" content="Aprenda HTML do zero ao avançado com exemplos práticos e explicações simples.">
  
  <!-- Autor -->
  <meta name="author" content="João Silva">
  
  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico">
  
  <!-- CSS externo -->
  <link rel="stylesheet" href="estilos.css">
</head>
```

### Open Graph (Redes Sociais)

Quando alguém compartilha seu link no WhatsApp ou Facebook, estas tags controlam o que aparece:

```html
<meta property="og:title" content="Aprenda HTML Completo">
<meta property="og:description" content="Curso gratuito de HTML nível universitário">
<meta property="og:image" content="https://site.com/thumbnail.jpg">
<meta property="og:url" content="https://site.com/html">
<meta property="og:type" content="article">
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Aprenda HTML">
<meta name="twitter:description" content="Curso completo e gratuito">
<meta name="twitter:image" content="https://site.com/thumb.jpg">
```

### SEO On-Page com HTML

| Fator | Como fazer em HTML |
|---|---|
| Título da página | `<title>` com keyword principal (máx 60 chars) |
| Descrição | `<meta name="description">` (máx 160 chars) |
| Títulos | `<h1>` único, `<h2>-<h6>` hierárquicos |
| Links internos | `<a href="/outra-pagina">texto descritivo</a>` |
| Imagens | `<img alt="descrição rica em keywords">` |
| URL canônica | `<link rel="canonical" href="URL principal">` |
| Idioma | `<html lang="pt-BR">` |
| Dados estruturados | JSON-LD com `<script type="application/ld+json">` |

### Dados Estruturados (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Aprenda HTML Completo",
  "author": { "@type": "Person", "name": "João Silva" },
  "datePublished": "2025-01-15"
}
</script>
```

> 💡 **Dica profissional**: O Google usa os dados estruturados para exibir rich snippets (estrelas, preços, FAQs) nos resultados de busca.', 1, 5);

  -- Módulo 6: Acessibilidade
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'Acessibilidade Web (a11y)', 'ARIA, WAI, leitores de tela e como tornar seu site acessível para todos.', 'Shield', 5)
  RETURNING id INTO v_mod6;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod6, 'Fundamentos de Acessibilidade', '## Fundamentos de Acessibilidade Web

### O que é Acessibilidade?

Acessibilidade web (abreviada como **a11y** — o "11" representa as 11 letras entre o "a" e o "y") significa criar sites que **todas as pessoas** possam usar, incluindo:

- 🦯 Pessoas cegas ou com baixa visão
- 🦻 Pessoas surdas ou com deficiência auditiva
- 🦽 Pessoas com deficiência motora
- 🧠 Pessoas com deficiências cognitivas

### Por que Acessibilidade Importa?

1. **É um direito**: No Brasil, a Lei Brasileira de Inclusão (13.146/2015) exige acessibilidade digital
2. **Mais usuários**: ~1 bilhão de pessoas no mundo têm alguma deficiência
3. **Melhor SEO**: Sites acessíveis são melhor indexados pelo Google
4. **Melhor UX para todos**: Legendas ajudam em ambientes barulhentos, contraste alto ajuda sob sol forte

### WCAG — As Diretrizes

O **WCAG** (Web Content Accessibility Guidelines) define 4 princípios:

| Princípio | Significado | Exemplo |
|---|---|---|
| **Perceptível** | Conteúdo pode ser percebido | Alt em imagens, legendas em vídeos |
| **Operável** | Pode ser operado por qualquer meio | Navegação por teclado |
| **Compreensível** | Conteúdo é entendível | Linguagem clara, erros explicados |
| **Robusto** | Funciona com tecnologias assistivas | HTML semântico válido |

### Checklist Básico de Acessibilidade HTML

- ✅ Todas imagens têm `alt` descritivo
- ✅ Formulários usam `<label>` associados
- ✅ Página navegável apenas com teclado (Tab, Enter, Esc)
- ✅ Contraste mínimo de 4.5:1 para texto
- ✅ HTML semântico (`<nav>`, `<main>`, `<article>`)
- ✅ Idioma definido: `<html lang="pt-BR">`
- ✅ Foco visível em elementos interativos
- ✅ Vídeos têm legendas/transcrição

### Navegação por Teclado

```html
<!-- Skip link: permite pular o menu -->
<a href="#conteudo" class="skip-link">Pular para o conteúdo</a>

<nav><!-- menu longo --></nav>

<main id="conteudo">
  <!-- conteúdo principal -->
</main>
```

O atributo `tabindex` controla a ordem de foco:
- `tabindex="0"`: Inclui na ordem natural
- `tabindex="-1"`: Focável via JS, mas não via Tab
- `tabindex="1+"`: **Evite!** Causa confusão na ordem

> 🧠 **Teste**: Tente navegar em um site usando apenas o teclado (Tab, Shift+Tab, Enter). Você consegue acessar tudo?', 0, 5),

  (v_mod6, 'ARIA e Tecnologias Assistivas', '## ARIA e Tecnologias Assistivas

### O que é ARIA?

**ARIA** (Accessible Rich Internet Applications) é um conjunto de atributos HTML que fornecem informações extras para tecnologias assistivas quando o HTML semântico sozinho não é suficiente.

### Regra de Ouro do ARIA

> **"Não use ARIA se puder usar HTML semântico."**

```html
<!-- ❌ Ruim: div com ARIA -->
<div role="button" tabindex="0" aria-label="Fechar">X</div>

<!-- ✅ Bom: HTML nativo -->
<button aria-label="Fechar">X</button>
```

### Atributos ARIA Mais Usados

| Atributo | Uso | Exemplo |
|---|---|---|
| `role` | Define o papel do elemento | `role="navigation"` |
| `aria-label` | Rótulo invisível | `aria-label="Menu principal"` |
| `aria-labelledby` | Referencia outro elemento como rótulo | `aria-labelledby="titulo"` |
| `aria-describedby` | Descrição adicional | `aria-describedby="dica"` |
| `aria-hidden` | Oculta do leitor de tela | `aria-hidden="true"` |
| `aria-expanded` | Estado expandido/colapsado | `aria-expanded="false"` |
| `aria-required` | Campo obrigatório | `aria-required="true"` |
| `aria-live` | Anuncia mudanças dinâmicas | `aria-live="polite"` |
| `aria-current` | Indica item atual | `aria-current="page"` |

### Exemplos Práticos

**Menu de Navegação**:
```html
<nav aria-label="Menu principal">
  <ul>
    <li><a href="/" aria-current="page">Início</a></li>
    <li><a href="/sobre">Sobre</a></li>
  </ul>
</nav>
```

**Accordion/Expandível**:
```html
<button aria-expanded="false" aria-controls="painel1">
  Seção 1
</button>
<div id="painel1" role="region" hidden>
  Conteúdo da seção 1
</div>
```

**Notificações Dinâmicas**:
```html
<div aria-live="polite" aria-atomic="true">
  <!-- Conteúdo atualizado via JS será anunciado -->
  Formulário enviado com sucesso!
</div>
```

**Ícones Decorativos vs. Informativos**:
```html
<!-- Ícone decorativo (ignorar) -->
<span aria-hidden="true">🎉</span> Parabéns!

<!-- Ícone informativo (descrever) -->
<span role="img" aria-label="Aviso">⚠️</span> Campo obrigatório
```

### Roles Comuns

| Role | Equivalente HTML5 |
|---|---|
| `role="banner"` | `<header>` |
| `role="navigation"` | `<nav>` |
| `role="main"` | `<main>` |
| `role="contentinfo"` | `<footer>` |
| `role="complementary"` | `<aside>` |
| `role="search"` | `<search>` (HTML5.2) |

### Ferramentas de Teste

1. **Lighthouse** (Chrome DevTools) — audita acessibilidade
2. **axe DevTools** — extensão do navegador
3. **NVDA** (Windows) — leitor de tela gratuito
4. **VoiceOver** (Mac/iOS) — leitor de tela nativo

> 💡 **Regra prática**: Se você usou HTML semântico corretamente, raramente precisará de ARIA. ARIA existe para preencher lacunas, não para substituir bom HTML.', 1, 5);

  -- Módulo 7: Boas Práticas e Projeto Final
  INSERT INTO public.modulos (curso_id, nome, descricao, icone, ordem)
  VALUES (v_curso_id, 'Boas Práticas e Projeto Final', 'Performance, validação, padrões profissionais e checklist de um projeto HTML completo.', 'Terminal', 6)
  RETURNING id INTO v_mod7;

  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem, moedas) VALUES
  (v_mod7, 'Performance e Validação', '## Performance e Validação HTML

### Por que Performance Importa?

O Google usa a velocidade da página como fator de ranqueamento. Cada segundo de carregamento a mais pode causar **7% de queda na conversão**.

### Otimizações no HTML

**1. Carregamento de CSS e JS**:
```html
<!-- CSS: no <head>, bloqueia renderização -->
<link rel="stylesheet" href="estilos.css">

<!-- JS: antes do </body> ou com defer/async -->
<script src="app.js" defer></script>
```

| Atributo | Comportamento |
|---|---|
| Sem atributo | Bloqueia o HTML, executa imediatamente |
| `async` | Baixa em paralelo, executa quando pronto |
| `defer` | Baixa em paralelo, executa após HTML parsed |

**2. Preload e Prefetch**:
```html
<!-- Preload: recurso necessário AGORA -->
<link rel="preload" href="fonte.woff2" as="font" crossorigin>

<!-- Prefetch: recurso necessário na PRÓXIMA página -->
<link rel="prefetch" href="/proxima-pagina.html">

<!-- DNS Prefetch: resolve DNS antecipadamente -->
<link rel="dns-prefetch" href="//cdn.exemplo.com">
```

**3. Lazy Loading**:
```html
<img src="foto.jpg" alt="..." loading="lazy">
<iframe src="mapa.html" loading="lazy"></iframe>
```

**4. Imagens Responsivas**:
```html
<picture>
  <source media="(max-width: 768px)" srcset="foto-mobile.webp">
  <source media="(min-width: 769px)" srcset="foto-desktop.webp">
  <img src="foto-fallback.jpg" alt="Descrição da imagem">
</picture>

<!-- Ou com srcset para densidade de pixel -->
<img 
  srcset="foto-1x.jpg 1x, foto-2x.jpg 2x, foto-3x.jpg 3x"
  src="foto-1x.jpg" 
  alt="Descrição"
>
```

### Validação HTML

Use o **W3C Validator** (validator.w3.org) para verificar erros:

Erros comuns:
- Tags não fechadas
- Atributos duplicados
- Elementos dentro de contextos inválidos
- `<p>` dentro de `<p>` (não permitido!)
- `<div>` dentro de `<span>` (bloco dentro de inline)

### Modelo de Conteúdo

| Categoria | Tags | Pode conter |
|---|---|---|
| **Block** | `<div>`, `<p>`, `<h1>` | Inline e block |
| **Inline** | `<span>`, `<a>`, `<strong>` | Apenas inline |
| **Void** | `<br>`, `<img>`, `<input>` | Nada |

> 🧠 **Dica**: Instale a extensão "HTMLHint" no VS Code para validação em tempo real enquanto escreve.', 0, 5),

  (v_mod7, 'Checklist Profissional de HTML', '## Checklist Profissional de HTML

### Estrutura do Documento

- [ ] `<!DOCTYPE html>` presente
- [ ] `<html lang="pt-BR">` com idioma correto
- [ ] `<meta charset="UTF-8">`
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- [ ] `<title>` descritivo e único (máx 60 caracteres)
- [ ] `<meta name="description">` (máx 160 caracteres)
- [ ] Favicon configurado
- [ ] Open Graph tags para redes sociais

### Semântica

- [ ] Apenas um `<h1>` por página
- [ ] Hierarquia de títulos sem pular níveis
- [ ] `<header>`, `<nav>`, `<main>`, `<footer>` usados
- [ ] `<article>` para conteúdo independente
- [ ] `<section>` para agrupamento temático
- [ ] `<aside>` para conteúdo complementar
- [ ] Sem `<div>` ou `<span>` desnecessários

### Acessibilidade

- [ ] Todas imagens têm `alt` descritivo
- [ ] Imagens decorativas: `alt=""` ou `aria-hidden="true"`
- [ ] Formulários: `<label>` associado a cada input
- [ ] Navegável por teclado (Tab, Enter, Esc)
- [ ] Skip link para conteúdo principal
- [ ] `aria-label` em elementos sem texto visível
- [ ] Contraste mínimo de 4.5:1
- [ ] `lang` atualizado para trechos em outros idiomas

### Performance

- [ ] CSS no `<head>`
- [ ] JS com `defer` ou antes de `</body>`
- [ ] Imagens com `loading="lazy"`
- [ ] Imagens com `width` e `height` definidos
- [ ] Formatos modernos (WebP, AVIF) com fallback
- [ ] `<link rel="preload">` para recursos críticos
- [ ] HTML minificado em produção

### Formulários

- [ ] `method` e `action` definidos
- [ ] Validação HTML5 (`required`, `type`, `pattern`)
- [ ] Mensagens de erro descritivas
- [ ] `<fieldset>` e `<legend>` para agrupamento
- [ ] `autocomplete` nos campos apropriados

### SEO

- [ ] URL canônica definida
- [ ] Dados estruturados (JSON-LD)
- [ ] Links internos com texto descritivo
- [ ] `<html lang>` correto
- [ ] `robots.txt` configurado
- [ ] Sitemap XML disponível

### Segurança

- [ ] Links externos: `rel="noopener noreferrer"`
- [ ] Formulários com CSRF token
- [ ] `Content-Security-Policy` no servidor
- [ ] HTTPS em produção

### Ferramentas Recomendadas

| Ferramenta | Propósito |
|---|---|
| **VS Code** | Editor com IntelliSense HTML |
| **W3C Validator** | Validação de HTML |
| **Lighthouse** | Auditoria completa |
| **axe DevTools** | Acessibilidade |
| **PageSpeed Insights** | Performance |
| **Can I Use** | Compatibilidade de browsers |

> 🎓 **Parabéns!** Ao completar este checklist em seus projetos, você estará seguindo os padrões profissionais da indústria. HTML é a fundação de tudo na web — domine-o e todo o resto fica mais fácil.', 1, 5);

  -- Resumos
  INSERT INTO public.resumos (materia, titulo, conteudo) VALUES
  ('HTML', 'Estrutura Básica do HTML', '## Estrutura Básica do HTML

Todo documento HTML segue esta estrutura:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título da Página</title>
</head>
<body>
  <!-- Conteúdo visível aqui -->
</body>
</html>
```

**Pontos-chave:**
- `<!DOCTYPE html>` declara HTML5
- `<head>` contém metadados invisíveis
- `<body>` contém o conteúdo visível
- Tags vêm em pares (abertura/fechamento) exceto void elements (`<br>`, `<img>`, `<input>`)
- Atributos fornecem informações extras às tags'),

  ('HTML', 'Tags Semânticas do HTML5', '## Tags Semânticas do HTML5

As tags semânticas dão **significado** ao conteúdo:

| Tag | Uso |
|---|---|
| `<header>` | Cabeçalho da página ou seção |
| `<nav>` | Navegação principal |
| `<main>` | Conteúdo principal (único por página) |
| `<article>` | Conteúdo independente e reutilizável |
| `<section>` | Agrupamento temático |
| `<aside>` | Conteúdo complementar |
| `<footer>` | Rodapé |
| `<figure>/<figcaption>` | Imagem com legenda |

**Por que usar?**
1. SEO — Google entende melhor a estrutura
2. Acessibilidade — Leitores de tela navegam por landmarks
3. Manutenção — Código mais legível'),

  ('HTML', 'Formulários e Validação HTML5', '## Formulários e Validação HTML5

### Elementos de Formulário
- `<form>` — container com `action` e `method`
- `<input>` — campo de entrada (20+ tipos)
- `<textarea>` — texto longo
- `<select>/<option>` — lista suspensa
- `<fieldset>/<legend>` — agrupamento
- `<label>` — rótulo (obrigatório!)

### Validação Nativa
```html
<input type="email" required>
<input type="text" minlength="3" maxlength="50">
<input type="number" min="0" max="100">
<input type="text" pattern="[A-Za-z]{3,}">
```

### Dicas
- Sempre associe `<label>` a cada input
- Use `type` correto para melhor UX mobile
- Validação HTML é a primeira camada — sempre valide no servidor também'),

  ('HTML', 'Acessibilidade Web — Guia Rápido', '## Acessibilidade Web (a11y) — Guia Rápido

### WCAG — 4 Princípios
1. **Perceptível**: Alt em imagens, legendas em vídeos
2. **Operável**: Navegação por teclado funcional
3. **Compreensível**: Linguagem clara, erros explicados
4. **Robusto**: HTML semântico válido

### Checklist Essencial
- ✅ `alt` em todas as imagens (descritivo ou vazio para decorativas)
- ✅ `<label>` em todos os inputs
- ✅ Contraste mínimo 4.5:1
- ✅ Navegação por teclado (Tab, Enter, Esc)
- ✅ Skip link para conteúdo principal
- ✅ `<html lang="pt-BR">`

### ARIA — Quando Usar
- Use HTML semântico primeiro!
- ARIA preenche lacunas: `aria-label`, `aria-expanded`, `aria-live`
- Roles principais: `navigation`, `main`, `banner`, `contentinfo`

### Ferramentas de Teste
- Lighthouse (Chrome), axe DevTools, NVDA, VoiceOver');

END $$;
