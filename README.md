# Site de agendamento da Barbearia Navalha

Site de uma página só para uma barbearia receber agendamentos. O cliente escolhe o barbeiro, o dia e o horário, escolhe o serviço, informa o nome e a forma de pagamento, e o site abre o WhatsApp da barbearia com a mensagem do agendamento já escrita.

Não precisa instalar nada nem ter servidor. São apenas HTML, CSS e JavaScript.

> **Nomes, preços, endereço e número de WhatsApp são provisórios.** Troque pelos dados reais antes de publicar (veja a seção "Como personalizar").

## Estrutura dos arquivos

```
projeto/
├── README.md                  este arquivo
└── barbearia-site/
    ├── index.html             estrutura e textos da página
    ├── style.css              visual (cores, fontes, layout)
    ├── script.js              agendamento, barbeiros, WhatsApp e cancelamento
    ├── favicon.svg            ícone da aba (poste de barbeiro)
    ├── favicon.ico            ícone para navegadores antigos
    └── apple-touch-icon.png   ícone para tela inicial do iPhone
```

Os arquivos de `barbearia-site` precisam ficar **na mesma pasta**.

## Como abrir

**Opção simples:** dê dois cliques em `index.html` e ele abre no navegador.

**Opção recomendada no VS Code:**
1. Abra a pasta do projeto no VS Code (Arquivo > Abrir Pasta).
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

A página atualiza sozinha a cada alteração salva. O site usa fontes do Google Fonts, então precisa de internet para mostrar a tipografia correta.

## O que o site faz

Fluxo do cliente:

1. **Apresentação** da barbearia, com dias e horário de funcionamento.
2. **Passo 1: barbeiro.** Cada barbeiro tem agenda própria e mostra o próximo horário livre dele.
3. **Passo 2: horário.** O cliente escolhe o dia (próximos 6 dias de atendimento) e o horário. A grade vai de 30 em 30 minutos, das 9h às 16h, porque cada corte dura 1 hora e a barbearia fecha às 17h.
4. **Passo 3: serviço.** Máquina, Máquina e tesoura, Máquina, tesoura e barba, ou Pezinho.
5. **Popup de confirmação.** O cliente informa o nome e a forma de pagamento (Pix, dinheiro, débito ou crédito).
6. **Página de agradecimento.** Mostra o resumo e abre o WhatsApp da barbearia com todos os dados na mensagem.

### Regras de horário

- Cada atendimento dura **1 hora**. Ao reservar, os horários que se sobrepõem a essa hora ficam indisponíveis. Exemplo: reservando 10:00 com o Rafael, ficam bloqueados 09:30, 10:00 e 10:30 na agenda dele.
- A agenda de cada barbeiro é **independente**. O Diego continua livre às 10:00.
- Horários que já passaram no dia de hoje não aparecem como disponíveis.
- Domingo é folga por padrão.

### Cancelamento

- Na página de agradecimento há o botão **Cancelar este agendamento**, com confirmação.
- Na seção **Meus agendamentos** da página principal, o cliente vê as reservas futuras feitas naquele navegador e pode cancelar cada uma.
- Ao cancelar, o horário volta a ficar livre e o site oferece um link para **avisar a barbearia pelo WhatsApp**, com a mensagem de cancelamento pronta.

### Outros detalhes

- **Barra de carregamento em forma de poste de barbeiro.** Aparece só se o carregamento passar de meio segundo e some quando tudo carrega (ou após 12 segundos).
- **Tema claro e escuro** automáticos, de acordo com o navegador do cliente.
- **Layout responsivo**, pensado primeiro para o celular.
- **Favicon** com as cores do poste de barbeiro.

## Como personalizar

Quase tudo fica no começo do `script.js`.

### `CONFIG`

| Campo | O que é |
|---|---|
| `name` | Nome da barbearia (cabeçalho e mensagens do WhatsApp) |
| `whatsapp` | Número com DDI e DDD, só dígitos. Exemplo: `5522999999999` |
| `address` | Endereço mostrado no rodapé |
| `stepMin` | Intervalo da grade de horários, em minutos (padrão 30) |
| `durationMin` | Duração de cada corte, em minutos (padrão 60) |
| `openDaysShown` | Quantos dias de atendimento aparecem para escolha (padrão 6) |

### `BARBERS`

Cada barbeiro tem `id`, `name`, `role` (especialidade), `openMin` e `closeMin` (horário de trabalho em minutos desde 00:00, por exemplo `9 * 60` para 9h) e `closedDays` (dias de folga, onde 0 é domingo e 6 é sábado). Para ter um terceiro barbeiro, copie uma linha e mude o `id`. O `id` deve ser único.

### `SERVICES` e `PAYMENTS`

Lista de serviços (nome, descrição e preço) e das formas de pagamento. Edite, adicione ou remova linhas à vontade.

### Textos e visual

- **Textos da página** (título, frase de abertura, "Seg a Sáb", "2 barbeiros", rodapé): `index.html`.
- **Nome no título da aba:** a tag `<title>` do `index.html`.
- **Cores e fontes:** variáveis no começo do `style.css`, dentro de `:root`. O tema escuro tem um bloco logo abaixo.

Se mudar o número de barbeiros, o horário ou os dias de funcionamento, lembre de atualizar também os textos fixos correspondentes no `index.html`.

## Como publicar

Por ser um site estático, qualquer hospedagem simples serve, como GitHub Pages, Netlify ou Vercel. Basta enviar a pasta `barbearia-site`. Hospedado em um domínio, o site funciona do mesmo jeito e o ícone de aba aparece normalmente.

## Limitações importantes

**1. O WhatsApp não envia a mensagem sozinho.**
O site abre o WhatsApp com a mensagem pronta, mas o cliente precisa tocar em "enviar". É uma regra do próprio WhatsApp para links de site. O envio totalmente automático exige a API oficial do WhatsApp Business, com número verificado e um servidor.

**2. As reservas ficam só no navegador de cada cliente.**
O site grava os horários em `localStorage`, então a agenda **não é compartilhada** entre clientes. Dois clientes diferentes ainda podem escolher o mesmo horário com o mesmo barbeiro. Na prática, a confirmação final é feita pela barbearia pelo WhatsApp, e vale o horário cuja mensagem chegou.
Consequência: um cliente que reservou e não foi não trava a agenda para os outros. Só aparece como ocupado no navegador dele.
Para uma agenda compartilhada de verdade é preciso um banco de dados, com painel para a barbearia cancelar ou marcar faltas e regra para reservas pendentes expirarem.

**3. Preços, nomes e número de WhatsApp são exemplos.** Substitua antes de usar.

## Problemas comuns

| Problema | Solução |
|---|---|
| O popup abre assim que a página carrega | Confirme que o `style.css` está atualizado e contém a regra `[hidden] { display: none !important; }`. |
| O ícone da aba não muda | Atualize com **Ctrl+F5**. Os navegadores guardam o favicon antigo por bastante tempo. |
| O WhatsApp não abre ao finalizar | O navegador pode ter bloqueado a nova aba. Use o botão **Abrir WhatsApp agora** na página de agradecimento. |
| Fontes diferentes do esperado | O site precisa de internet para baixar as fontes do Google Fonts. Sem ela, usa fontes do sistema. |
| Horários antigos aparecem ocupados | Os dados ficam no navegador. Limpe os dados do site nas configurações para zerar. |

## Ideias para os próximos passos

- Agenda compartilhada com banco de dados, para bloquear horários para todos os clientes.
- Painel da barbearia para ver, confirmar, cancelar e marcar faltas.
- Integração com a API oficial do WhatsApp Business para envio automático e lembretes.
- Duração diferente por serviço (hoje todos duram 1 hora).