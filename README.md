# CONNEXTSIMUL

Simulador visual de conexões elétricas em React + Vite.

## Regras estruturais e Funcionalidades atuais

- Cada sub-região é um retângulo vertical com pontos conectáveis à esquerda e à direita.
- O número de ramas é configurável. As ramas são identificadas localmente como R1, R2, R3... de baixo para cima.
- A numeração de ramas é contínua e sequencial ao longo de todo o projeto (Global Branches).
- Uma sub-região com `R` ramas possui inicialmente `R + 1` nós. Cada abertura entre duas ramas acrescenta 1 nó.
- **Todos os nós são pontos externos e conectáveis.** Os conectores estão presentes nas bordas esquerda e direita do bloco de sub-região, não interferindo visualmente no corpo do componente.
- O algoritmo inteligente de conexão traça as curvas baseando-se na proximidade e nas extremidades apropriadas (esquerda/direita) de cada nó, evitando transpassar o corpo dos blocos.
- Uma abertura separa o nó compartilhado em dois pontos independentes, mantendo o mesmo número de ramas.
- A numeração exibida dos pontos é **global e única** entre todas as sub-regiões.
- A ordem global é: sub-regiões da esquerda para a direita; dentro de cada sub-região, nós de baixo para cima.
- Deleção de sub-regiões adicionada (via botão no painel de propriedades ou tecla `Delete` com o bloco focado).
- A tabela de potenciais e a exportação CSV escaneiam rigorosamente **apenas as conexões feitas manualmente** pelo usuário (ignora pontencialidades formadas internamente pelas ramas contínuas). Grupos de nós interligados são listados sob uma única "Linha" e expostos ao longo das colunas "N1", "N2", etc.

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
NÓ +4
NÓ -3
rama 2
NÓ 2
rama 1
NÓ -1
```

O espaço da abertura cria dois pontos independentes, `-3` e `+4`.

## Executar

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173/`.
