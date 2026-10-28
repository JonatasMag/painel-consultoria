/* =============================================================
 * FERRAMENTAS: material gratuito para quem se cadastra.
 * Os arquivos ficam na pasta ferramentas/ do site.
 * ============================================================= */
window.FERRAMENTAS = [
  {
    id: "precificacao", codigo: "POP-F01", nome: "Precificação de produtos",
    resumo: "Calcula o preço que cobre o custo, as despesas fixas, os impostos e as taxas, e ainda deixa o lucro que você quer.",
    entrega: ["Preço sugerido por markup", "Margem real de cada produto", "Alerta de produto com prejuízo", "Comparação com o concorrente"],
    planilha: "ferramentas/planilhas/precificacao-de-produtos.xlsx", pop: "ferramentas/pops/POP-F01-precificacao-de-produtos",
  },
  {
    id: "5w2h", codigo: "POP-F02", nome: "Plano de ação 5W2H",
    resumo: "Transforma uma meta em ações com o quê, por quê, onde, quem, quando, como e quanto custa, e mostra o que está atrasado.",
    entrega: ["Situação automática de cada ação", "Resumo por responsável", "Custo total do plano", "Percentual concluído"],
    planilha: "ferramentas/planilhas/plano-de-acao-5w2h.xlsx", pop: "ferramentas/pops/POP-F02-plano-de-acao-5w2h",
  },
  {
    id: "4ps", codigo: "POP-F03", nome: "4 Ps do marketing",
    resumo: "Avalia produto, preço, praça e promoção com notas e pesos, aponta o ponto mais fraco e organiza as ações de melhoria.",
    entrega: ["16 perguntas prontas", "Índice de 0 a 100% por P", "Prioridade automática", "Gráfico do resultado"],
    planilha: "ferramentas/planilhas/analise-4ps-do-marketing.xlsx", pop: "ferramentas/pops/POP-F03-analise-4ps-do-marketing",
  },
  {
    id: "pdca", codigo: "POP-F04", nome: "Ciclo PDCA",
    resumo: "Conduz a melhoria de um indicador em quatro fases, com análise de causas e acompanhamento do resultado contra a meta.",
    entrega: ["Atividades por fase", "Priorização de causas (6M)", "Gráfico meta × resultado", "Andamento de cada fase"],
    planilha: "ferramentas/planilhas/ciclo-pdca.xlsx", pop: "ferramentas/pops/POP-F04-ciclo-pdca",
  },
  {
    id: "swot", codigo: "POP-F05", nome: "Matriz SWOT (FOFA)",
    resumo: "Organiza forças, fraquezas, oportunidades e ameaças, monta a matriz com os fatores mais importantes e sugere a postura estratégica.",
    entrega: ["Matriz 2 × 2 automática", "Pontuação por quadrante", "Postura estratégica sugerida", "Estratégias cruzadas FO, FA, DO e DA"],
    planilha: "ferramentas/planilhas/matriz-swot.xlsx", pop: "ferramentas/pops/POP-F05-matriz-swot",
  },
];

// Materiais da consultoria: aparecem para o cliente só como vitrine (sem download)
window.EXCLUSIVO = [
  { n: 1, nome: "Diagnosticar", texto: "Entender como a empresa funciona hoje e por onde começar.",
    itens: ["Questionário de diagnóstico por tipo de empresa", "Relatório com nota por área e principais achados", "Plano recomendado com prioridades e investimento"] },
  { n: 2, nome: "Organizar", texto: "Procedimentos e controles que a equipe consegue seguir.",
    itens: ["POP-01 Recebimento de mercadorias", "POP-02 Contagem rotativa de estoque", "POP-03 Compras e reposição", "POP-04 Fechamento de caixa e fluxo de caixa", "POP-05 Contas a pagar e a receber", "POP-06 Registro e análise de vendas", "6 planilhas de controle: estoque, contagem, compras, caixa, contas e vendas"] },
  { n: 3, nome: "Medir", texto: "Indicadores que mostram o resultado mês a mês.",
    itens: ["Dashboard simples", "Dashboard completo com vendas, estoque e financeiro", "Kit Power BI com medidas prontas", "Passo a passo para ligar os dados da empresa"] },
  { n: 4, nome: "Automatizar", texto: "Menos tarefa manual e respostas mais rápidas.",
    itens: ["Aviso de estoque baixo no Google Sheets", "Relatório semanal de vendas por e-mail", "Novo pedido no site vai para a planilha e avisa a equipe", "Atendimento automático no WhatsApp", "Landing page de captação"] },
  { n: 5, nome: "Acompanhar", texto: "Reunião mensal e avisos quando algo sai do combinado.",
    itens: ["Plano de acompanhamento mensal", "Registro de reuniões e indicadores", "Avisos automáticos de atraso e de indicador pendente"] },
  { n: 6, nome: "Treinar", texto: "A equipe aprende a usar tudo com os dados da própria empresa.",
    itens: ["Excel para gestão (4 h)", "Power BI do zero (6 h)", "Processos e POPs na prática (3 h)", "Indicadores e reunião mensal (3 h)", "Certificado com o nome de cada participante"] },
];
