# CONNEXTSIMUL

Simulador visual de conexões elétricas em React + Vite.

## Regras estruturais e Funcionalidades atuais

- Cada sub-região é um retângulo vertical com pontos conectáveis à esquerda e à direita.
- **Conexão entre nós da mesma sub-região:** Agora é possível conectar nós de uma mesma sub-região entre si (o algoritmo desenha um loop limpo na lateral correspondente).
- **Sub-região Hélice Múltipla:** Criação em lote de sequências horizontais de sub-regiões (cada uma com 1 rama e 2 nós). A disposição horizontal segue a ordem alternada dos extremos para o centro: `1, N, 2, N-1, 3, N-2...`. O sistema conecta automaticamente o polo `(-)` de cada hélice ao polo `(+)` da hélice seguinte na sequência.
- **Numeração Estática por Ordem de Nascimento:** Nas sub-regiões pertencentes a uma Hélice Múltipla, os números dos nós e das ramas seguem estritamente a ordem de criação/nascimento (`Hélice 1` recebe os primeiros nós, `Hélice 2` os seguintes, e assim sucessivamente), independentemente da posição física $x$ alternada na tela ou de movimentações horizontais posteriores.
- **Disposição e Rolagem Horizontal:** Todas as sub-regiões são geradas e organizadas na horizontal na mesma altura (`y = 100`), expandindo o canvas dinamicamente sem necessidade de rolagem vertical. É possível navegar horizontalmente com a roda do mouse ou arrastar as subs.
- O número de ramas é configurável. As ramas são identificadas localmente como R1, R2, R3... de baixo para cima.
- A numeração de ramas é contínua e sequencial ao longo de todo o projeto (Global Branches).
- Uma sub-região com `R` ramas possui inicialmente `R + 1` nós. Cada abertura entre duas ramas acrescenta 1 nó.
- **Todos os nós são pontos externos e conectáveis.** Os conectores estão presentes nas bordas esquerda e direita do bloco de sub-região, não interferindo visualmente no corpo do componente.
- O algoritmo inteligente de conexão traça as curvas baseando-se na proximidade e nas extremidades apropriadas (esquerda/direita) de cada nó, evitando transpassar o corpo dos blocos.
- Uma abertura separa o nó compartilhado em dois pontos independentes, mantendo o mesmo número de ramas.
- A numeração exibida dos pontos é **global e única** entre todas as sub-regiões.
- A ordem global é: sub-regiões da esquerda para a direita; dentro de cada sub-região, nós de baixo para cima.
- Deleção de sub-regiões adicionada (via botão no painel de propriedades ou tecla `Delete` com o bloco focado).
- A tabela de conexões e a exportação CSV listam as conexões na **ordem em que foram criadas/definidas** (preservando o sentido de origem `N1` para destino `N2`). No caso da Hélice Múltipla, a tabela reflete diretamente a sequência em série pré-definida das ligações.

## Exemplo de abertura

Com 4 ramas:

```text
NÓ +5
rama 4
NÓ 4
rama 3
NÓ 3
rama 2
NÓ 2
rama 1
NÓ -1
```

Abrindo a conexão entre ramas 2 e 3:

```text
NÓ +6
rama 4
NÓ 5
rama 3
NÓ -4
NÓ +3
rama 2
NÓ 2
rama 1
NÓ -1
```

O espaço da abertura cria dois pontos independentes alternados, `+3` e `-4`.

## Executar

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173/`.
