
-- Create HTML course
INSERT INTO public.cursos (nome, descricao, assunto, tempo_estimado, moedas_total, icone, ordem)
VALUES ('HTML Completo', 'Aprenda HTML do zero ao avançado, dominando a estrutura de páginas web modernas.', 'Desenvolvimento Web', '20 horas', 50, 'Code', 0);

-- Get the curso id for the modules
DO $$
DECLARE
  v_curso_id uuid;
  v_mod1 uuid;
  v_mod2 uuid;
  v_mod3 uuid;
  v_mod4 uuid;
  v_mod5 uuid;
BEGIN
  SELECT id INTO v_curso_id FROM public.cursos WHERE nome = 'HTML Completo' LIMIT 1;

  -- Module 1: Introdução
  INSERT INTO public.modulos (nome, descricao, icone, ordem, curso_id) VALUES ('Introdução ao HTML', 'Conceitos fundamentais e primeiros passos', 'BookOpen', 0, v_curso_id) RETURNING id INTO v_mod1;
  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem) VALUES
    (v_mod1, 'O que é HTML?', '# O que é HTML?

HTML (HyperText Markup Language) é a linguagem padrão para criar páginas web. Ela define a **estrutura** e o **conteúdo** de uma página.

## Características principais
- Linguagem de **marcação** (não é programação)
- Usa **tags** para definir elementos
- É interpretado pelo **navegador**
- Base de toda página web

## Como funciona?
O navegador lê o código HTML e renderiza visualmente os elementos na tela. Cada tag tem um significado semântico que indica ao navegador como exibir o conteúdo.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Minha Página</title>
  </head>
  <body>
    <h1>Olá, Mundo!</h1>
  </body>
</html>
```', 0),
    (v_mod1, 'Estrutura básica de um documento', '# Estrutura Básica do HTML

Todo documento HTML segue uma estrutura padrão:

## DOCTYPE
Declara o tipo do documento:
```html
<!DOCTYPE html>
```

## Elemento html
Envolve todo o conteúdo da página:
```html
<html lang="pt-BR">
```

## Head
Contém metadados (título, charset, links CSS):
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título da Página</title>
</head>
```

## Body
Contém o conteúdo visível da página:
```html
<body>
  <h1>Conteúdo aqui</h1>
</body>
```', 1),
    (v_mod1, 'Tags, elementos e atributos', '# Tags, Elementos e Atributos

## Tags
São os blocos de construção do HTML. Possuem abertura e fechamento:
```html
<p>Isso é um parágrafo</p>
```

Algumas tags são **auto-fechantes**:
```html
<br />
<img src="foto.jpg" alt="Foto" />
<hr />
```

## Elementos
Um elemento é a tag + seu conteúdo:
```html
<a href="https://site.com">Clique aqui</a>
```

## Atributos
Fornecem informações adicionais sobre os elementos:
- **id** — identificador único
- **class** — classe para estilização
- **src** — fonte de imagens/scripts
- **href** — destino de links
- **alt** — texto alternativo

```html
<img id="logo" class="imagem-destaque" src="logo.png" alt="Logo da empresa" />
```', 2);

  -- Module 2: Textos e Formatação
  INSERT INTO public.modulos (nome, descricao, icone, ordem, curso_id) VALUES ('Textos e Formatação', 'Títulos, parágrafos, listas e formatação de texto', 'Type', 1, v_curso_id) RETURNING id INTO v_mod2;
  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem) VALUES
    (v_mod2, 'Títulos e parágrafos', '# Títulos e Parágrafos

## Títulos (h1 a h6)
HTML possui 6 níveis de títulos:
```html
<h1>Título Principal</h1>
<h2>Subtítulo</h2>
<h3>Seção</h3>
<h4>Subseção</h4>
<h5>Detalhe</h5>
<h6>Menor título</h6>
```

**Regras importantes:**
- Use apenas **um h1** por página
- Siga a **hierarquia** (não pule de h1 para h4)
- Títulos ajudam na **acessibilidade** e **SEO**

## Parágrafos
```html
<p>Este é um parágrafo de texto.</p>
<p>Este é outro parágrafo separado.</p>
```

## Quebra de linha
```html
<p>Primeira linha<br />Segunda linha</p>
```

## Linha horizontal
```html
<hr />
```', 0),
    (v_mod2, 'Formatação de texto', '# Formatação de Texto

## Negrito e Itálico
```html
<strong>Texto importante (negrito)</strong>
<em>Texto enfatizado (itálico)</em>
<b>Negrito visual</b>
<i>Itálico visual</i>
```

> **strong** vs **b**: `strong` tem significado semântico (importância), `b` é apenas visual.

## Outras formatações
```html
<mark>Texto destacado</mark>
<small>Texto menor</small>
<del>Texto riscado</del>
<ins>Texto inserido (sublinhado)</ins>
<sub>Subscrito</sub>
<sup>Sobrescrito</sup>
<code>código inline</code>
```

## Citações
```html
<blockquote>
  "A educação é a arma mais poderosa."
  <cite>— Nelson Mandela</cite>
</blockquote>

<q>Citação curta inline</q>
```', 1),
    (v_mod2, 'Listas ordenadas e não ordenadas', '# Listas em HTML

## Lista não ordenada (ul)
```html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

## Lista ordenada (ol)
```html
<ol>
  <li>Primeiro passo</li>
  <li>Segundo passo</li>
  <li>Terceiro passo</li>
</ol>
```

## Lista de definição (dl)
```html
<dl>
  <dt>HTML</dt>
  <dd>Linguagem de marcação para web</dd>
  <dt>CSS</dt>
  <dd>Linguagem de estilização</dd>
</dl>
```

## Listas aninhadas
```html
<ul>
  <li>Frontend
    <ul>
      <li>HTML</li>
      <li>CSS</li>
      <li>JavaScript</li>
    </ul>
  </li>
  <li>Backend</li>
</ul>
```', 2);

  -- Module 3: Links, Imagens e Mídia
  INSERT INTO public.modulos (nome, descricao, icone, ordem, curso_id) VALUES ('Links, Imagens e Mídia', 'Navegação, imagens, áudio e vídeo', 'Image', 2, v_curso_id) RETURNING id INTO v_mod3;
  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem) VALUES
    (v_mod3, 'Links e navegação', '# Links em HTML

## Link básico
```html
<a href="https://google.com">Ir para o Google</a>
```

## Atributos importantes
```html
<!-- Abrir em nova aba -->
<a href="https://site.com" target="_blank" rel="noopener noreferrer">Link externo</a>

<!-- Link para email -->
<a href="mailto:contato@site.com">Enviar email</a>

<!-- Link para telefone -->
<a href="tel:+5511999999999">Ligar</a>

<!-- Link para seção da página (âncora) -->
<a href="#secao2">Ir para Seção 2</a>
<h2 id="secao2">Seção 2</h2>
```

## Link para download
```html
<a href="arquivo.pdf" download>Baixar PDF</a>
```

## Navegação semântica
```html
<nav>
  <a href="/">Home</a>
  <a href="/sobre">Sobre</a>
  <a href="/contato">Contato</a>
</nav>
```', 0),
    (v_mod3, 'Imagens e figuras', '# Imagens em HTML

## Tag img
```html
<img src="foto.jpg" alt="Descrição da foto" width="600" height="400" />
```

**Atributos essenciais:**
- **src** — caminho da imagem
- **alt** — texto alternativo (acessibilidade + SEO)
- **width/height** — dimensões

## Figure e Figcaption
```html
<figure>
  <img src="grafico.png" alt="Gráfico de vendas 2024" />
  <figcaption>Gráfico de vendas do ano de 2024</figcaption>
</figure>
```

## Formatos de imagem
| Formato | Uso ideal |
|---------|-----------|
| JPG | Fotos |
| PNG | Imagens com transparência |
| SVG | Ícones e logos |
| WebP | Otimizado para web |
| GIF | Animações simples |

## Imagem responsiva
```html
<img src="foto.jpg" alt="Foto" style="max-width: 100%; height: auto;" />
```', 1),
    (v_mod3, 'Áudio e vídeo', '# Mídia em HTML

## Vídeo
```html
<video controls width="640" height="360">
  <source src="video.mp4" type="video/mp4" />
  <source src="video.webm" type="video/webm" />
  Seu navegador não suporta vídeo.
</video>
```

**Atributos úteis:**
- `controls` — exibe controles
- `autoplay` — reproduz automaticamente
- `muted` — inicia sem som
- `loop` — repete infinitamente
- `poster` — imagem de capa

## Áudio
```html
<audio controls>
  <source src="musica.mp3" type="audio/mpeg" />
  <source src="musica.ogg" type="audio/ogg" />
  Seu navegador não suporta áudio.
</audio>
```

## Incorporar vídeo do YouTube
```html
<iframe 
  width="560" height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Título do vídeo"
  allowfullscreen>
</iframe>
```', 2);

  -- Module 4: Tabelas e Formulários
  INSERT INTO public.modulos (nome, descricao, icone, ordem, curso_id) VALUES ('Tabelas e Formulários', 'Organização de dados e entrada do usuário', 'Table', 3, v_curso_id) RETURNING id INTO v_mod4;
  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem) VALUES
    (v_mod4, 'Tabelas', '# Tabelas em HTML

## Estrutura básica
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
</table>
```

## Elementos semânticos
- `<thead>` — cabeçalho da tabela
- `<tbody>` — corpo da tabela
- `<tfoot>` — rodapé da tabela
- `<th>` — célula de cabeçalho
- `<td>` — célula de dados

## Mesclar células
```html
<td colspan="2">Ocupa 2 colunas</td>
<td rowspan="3">Ocupa 3 linhas</td>
```', 0),
    (v_mod4, 'Formulários - Inputs básicos', '# Formulários em HTML

## Estrutura do formulário
```html
<form action="/enviar" method="POST">
  <!-- campos aqui -->
  <button type="submit">Enviar</button>
</form>
```

## Tipos de input
```html
<!-- Texto -->
<label for="nome">Nome:</label>
<input type="text" id="nome" name="nome" placeholder="Seu nome" required />

<!-- Email -->
<input type="email" name="email" placeholder="seu@email.com" />

<!-- Senha -->
<input type="password" name="senha" />

<!-- Número -->
<input type="number" name="idade" min="0" max="120" />

<!-- Telefone -->
<input type="tel" name="telefone" />

<!-- Data -->
<input type="date" name="nascimento" />

<!-- Checkbox -->
<input type="checkbox" id="aceito" name="aceito" />
<label for="aceito">Aceito os termos</label>

<!-- Radio -->
<input type="radio" name="genero" value="m" /> Masculino
<input type="radio" name="genero" value="f" /> Feminino
```

## Textarea e Select
```html
<textarea name="mensagem" rows="4" cols="50" placeholder="Sua mensagem"></textarea>

<select name="estado">
  <option value="">Selecione</option>
  <option value="SP">São Paulo</option>
  <option value="RJ">Rio de Janeiro</option>
</select>
```', 1),
    (v_mod4, 'Formulários - Validação e acessibilidade', '# Validação e Acessibilidade em Formulários

## Validação nativa do HTML
```html
<!-- Campo obrigatório -->
<input type="text" required />

<!-- Tamanho mínimo/máximo -->
<input type="text" minlength="3" maxlength="50" />

<!-- Padrão (regex) -->
<input type="text" pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}" placeholder="000.000.000-00" />

<!-- Range de números -->
<input type="number" min="1" max="100" step="1" />
```

## Acessibilidade
```html
<!-- Sempre use label com for -->
<label for="email">Email:</label>
<input type="email" id="email" name="email" />

<!-- Fieldset para agrupar -->
<fieldset>
  <legend>Dados Pessoais</legend>
  <label for="nome">Nome:</label>
  <input type="text" id="nome" />
</fieldset>

<!-- ARIA para leitores de tela -->
<input type="search" aria-label="Buscar no site" />
```

## Atributos úteis
- `placeholder` — texto de exemplo
- `autofocus` — foco automático
- `disabled` — desabilitado
- `readonly` — somente leitura
- `autocomplete` — sugestões do navegador', 2);

  -- Module 5: HTML Semântico e Boas Práticas
  INSERT INTO public.modulos (nome, descricao, icone, ordem, curso_id) VALUES ('HTML Semântico e Boas Práticas', 'Elementos semânticos, acessibilidade e SEO', 'Award', 4, v_curso_id) RETURNING id INTO v_mod5;
  INSERT INTO public.modulo_topicos (modulo_id, titulo, conteudo, ordem) VALUES
    (v_mod5, 'Elementos semânticos do HTML5', '# HTML Semântico

Tags semânticas dão **significado** ao conteúdo, melhorando acessibilidade e SEO.

## Estrutura de página semântica
```html
<body>
  <header>
    <nav><!-- navegação --></nav>
  </header>
  
  <main>
    <article>
      <header>
        <h1>Título do Artigo</h1>
        <time datetime="2024-01-15">15 de Janeiro, 2024</time>
      </header>
      <section>
        <h2>Seção 1</h2>
        <p>Conteúdo...</p>
      </section>
    </article>
    
    <aside>
      <!-- conteúdo lateral -->
    </aside>
  </main>
  
  <footer>
    <p>&copy; 2024 Meu Site</p>
  </footer>
</body>
```

## Tags semânticas principais
| Tag | Uso |
|-----|-----|
| `<header>` | Cabeçalho da página/seção |
| `<nav>` | Navegação |
| `<main>` | Conteúdo principal |
| `<article>` | Conteúdo independente |
| `<section>` | Seção temática |
| `<aside>` | Conteúdo lateral |
| `<footer>` | Rodapé |
| `<figure>` | Imagem com legenda |
| `<time>` | Data/hora |
| `<details>` | Acordeão nativo |', 0),
    (v_mod5, 'Meta tags e SEO', '# Meta Tags e SEO

## Meta tags essenciais
```html
<head>
  <!-- Charset -->
  <meta charset="UTF-8" />
  
  <!-- Viewport (responsividade) -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Título (aparece na aba e no Google) -->
  <title>Meu Site - Página Inicial</title>
  
  <!-- Descrição (aparece no Google) -->
  <meta name="description" content="Descrição do site em até 160 caracteres" />
  
  <!-- Autor -->
  <meta name="author" content="Seu Nome" />
  
  <!-- Favicon -->
  <link rel="icon" href="favicon.ico" />
</head>
```

## Open Graph (compartilhamento em redes sociais)
```html
<meta property="og:title" content="Título do Site" />
<meta property="og:description" content="Descrição para redes sociais" />
<meta property="og:image" content="https://site.com/imagem.jpg" />
<meta property="og:url" content="https://site.com" />
<meta property="og:type" content="website" />
```

## Boas práticas de SEO com HTML
1. Um **h1** por página
2. Hierarquia correta de títulos
3. **alt** em todas as imagens
4. URLs amigáveis
5. Links descritivos (evite "clique aqui")
6. Conteúdo acessível', 1),
    (v_mod5, 'Acessibilidade e boas práticas', '# Acessibilidade e Boas Práticas

## Acessibilidade (a11y)

### ARIA Roles
```html
<div role="alert">Mensagem importante!</div>
<button aria-label="Fechar menu">✕</button>
<div aria-hidden="true">Conteúdo decorativo</div>
```

### Navegação por teclado
```html
<!-- tabindex para ordem de foco -->
<div tabindex="0">Focável por tab</div>

<!-- Skip navigation -->
<a href="#main-content" class="skip-link">Pular para conteúdo</a>
```

### Contraste e legibilidade
- Contraste mínimo **4.5:1** para texto normal
- Contraste mínimo **3:1** para texto grande
- Não use apenas cor para transmitir informação

## Boas Práticas Gerais

1. ✅ **Indentação consistente** (2 ou 4 espaços)
2. ✅ **Comentários** para seções complexas
3. ✅ **Nomes descritivos** para classes e IDs
4. ✅ **Validar** seu HTML (validator.w3.org)
5. ✅ **Fechar** todas as tags
6. ✅ Usar **lowercase** para tags e atributos
7. ✅ Usar **aspas duplas** para atributos

```html
<!-- ✅ Bom -->
<img src="foto.jpg" alt="Foto do produto" class="produto-img" />

<!-- ❌ Ruim -->
<IMG SRC=foto.jpg>
```

🎉 **Parabéns!** Você completou o curso de HTML! Agora você tem uma base sólida para começar a criar páginas web.', 2);

END $$;
