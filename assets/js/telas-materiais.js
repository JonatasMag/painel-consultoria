/* =============================================================
 * MATERIAIS: POPs, apostilas, certificados, dashboards modelo,
 * biblioteca geral e configurações.
 * ============================================================= */
(function (P) {
  "use strict";
  var C = window.CONTEUDO, S = window.Store, G = window.Graf, D = window.DADOS_EXEMPLO, esc = P.esc, K = C.consultor;

  function voltar(c, etapa) {
    return c ? '<a class="btn btn-linha" href="#/cliente/' + c.id + "/" + etapa + '">Voltar ao cliente</a>' : '<a class="btn btn-linha" href="#/biblioteca">Voltar aos materiais</a>';
  }
  function barraImpressao(c, etapa, rotulo) {
    return '<div class="nao-imprimir"><p class="migalha">' + (c ? '<a href="#/cliente/' + c.id + "/" + etapa + '">' + esc(c.empresa) + "</a>" : '<a href="#/biblioteca">Materiais</a>') + " / " + esc(rotulo) + "</p>" +
      '<div class="acoes" style="margin-bottom:18px"><button class="btn btn-sinal" onclick="window.print()">Imprimir ou salvar PDF</button>' + voltar(c, etapa) + "</div></div>";
  }

  // ---------- POP no padrão ABNT, com timbrado ----------
  function arquivoPop(pop) {
    return pop.arquivo || (pop.id + "-" + pop.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  function alineas(itens) {
    var letras = "abcdefghijklmnopqrstuvwxyz";
    return '<ol class="alineas">' + itens.map(function (t, i) {
      var s = t.trim(), w = s.split(/\s/)[0];
      if (!(w.length > 1 && w === w.toUpperCase())) s = s.charAt(0).toLowerCase() + s.slice(1);
      s = s.replace(/[.;]$/, "") + (i === itens.length - 1 ? "." : ";");
      return "<li><span>" + letras[i] + ")</span> " + esc(s) + "</li>";
    }).join("") + "</ol>";
  }
  function timbradoTopo(codigo) {
    return '<div class="timbrado-topo"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 34.5 19 23l8 7 13-16" fill="none" stroke="#0c2238" stroke-width="3.5" stroke-linecap="square"/><circle cx="8" cy="34.5" r="3.4" fill="#0c2238"/><circle cx="19" cy="23" r="3.4" fill="#0c2238"/><circle cx="27" cy="30" r="3.4" fill="#0c2238"/><circle cx="40" cy="14" r="3.4" fill="#e8a33d"/></svg>' +
      "<b>JONATAS MAGALHÃES</b><span>Consultoria em Dados, Processos e Operações</span><em>" + esc(codigo) + "</em></div>";
  }
  function timbradoRodape() { return '<div class="timbrado-rodape">' + esc(K.site) + "  |  " + esc(K.email) + "  |  " + esc(K.whatsapp) + "  |  Joinville – SC</div>"; }

  P.views.pop = function (main, id, q) {
    var pop = C.pops.filter(function (p) { return p.id === id; })[0];
    if (!pop) return P.views.naoEncontrado(main);
    var c = q.get("c") ? S.cliente(q.get("c")) : null;
    var pl = C.planilhas.filter(function (x) { return x.arquivo === pop.planilha; })[0];
    var arq = "materiais/pops/" + arquivoPop(pop);
    var etapas = pop.etapas || [["Execução", pop.passos]];
    var n = 0, corpo = "";
    function sec(t) { n++; return "<h2>" + n + " " + t.toUpperCase() + "</h2>"; }
    var ficha = [["Código", pop.id], ["Versão", "1.0, de " + P.dataBR(P.hoje())], ["Área", pop.area && C.areas[pop.area] ? C.areas[pop.area].nome : pop.area],
      ["Responsável", pop.responsavel], ["Frequência", pop.frequencia], ["Registro", "Planilha " + (pl ? pl.nome + " (" + pop.planilha + ")" : pop.planilha)],
      ["Indicador e meta", pop.indicador], ["Empresa", c ? c.empresa : "______________________________"]];
    corpo += '<p class="abnt-titulo">PROCEDIMENTO OPERACIONAL PADRÃO<br>' + esc(pop.id) + " – " + esc(pop.titulo.toUpperCase()) + "</p>";
    corpo += '<table class="abnt-ficha"><tbody>' + ficha.map(function (l) { return "<tr><th>" + l[0] + "</th><td>" + esc(l[1]) + "</td></tr>"; }).join("") + "</tbody></table>";
    corpo += sec("Objetivo") + "<p>" + esc(pop.objetivo) + "</p>";
    if (pop.aplicacao) corpo += sec("Campo de aplicação") + "<p>" + esc(pop.aplicacao) + "</p>";
    if (pop.responsabilidades) corpo += sec("Responsabilidades") + '<table class="abnt-tab"><thead><tr><th>Função</th><th>Atribuição</th></tr></thead><tbody>' + pop.responsabilidades.map(function (r) { return "<tr><td>" + esc(r.papel) + "</td><td>" + esc(r.faz) + "</td></tr>"; }).join("") + "</tbody></table>";
    if (pop.definicoes) corpo += sec("Definições") + pop.definicoes.map(function (d) { return "<p><b>" + esc(d[0]) + ":</b> " + esc(d[1]) + "</p>"; }).join("");
    if (pop.materiais) corpo += sec("Materiais e recursos") + alineas(pop.materiais);
    corpo += sec("Procedimento");
    var np = n;
    etapas.forEach(function (e, i) { corpo += "<h3>" + np + "." + (i + 1) + " " + esc(e[0].toUpperCase()) + "</h3>" + alineas(e[1]); });
    corpo += sec("Indicador de desempenho") + "<p>" + esc(pop.indicadorTexto || pop.indicador) + "</p>";
    corpo += sec("Tratamento de não conformidades") + "<p>" + esc(pop.naoConformidade || "Anote o que aconteceu, a causa provável e o que foi feito. Leve os casos repetidos para a reunião mensal: se o mesmo problema volta, o procedimento precisa mudar.") + "</p>";
    corpo += sec("Controle de revisões e aprovação") + '<table class="abnt-tab"><thead><tr><th>Versão</th><th>Data</th><th>Alteração</th><th>Responsável</th></tr></thead><tbody><tr><td>1.0</td><td>' + P.dataBR(P.hoje()) + "</td><td>Emissão inicial</td><td>" + esc(K.nome) + "</td></tr><tr><td>&nbsp;</td><td></td><td></td><td></td></tr></tbody></table>" +
      '<table class="abnt-ficha abnt-assina"><tbody><tr><th>Elaborado por</th><td>' + esc(K.nome) + " – Administrador</td></tr><tr><th>Aprovado por</th><td>" + esc(c && c.contato ? c.contato : "Nome: ______________________________") + "</td></tr><tr><th>Assinatura e data</th><td>__________________________  ____/____/______</td></tr></tbody></table>";
    if (pop.referencias) corpo += '<p class="abnt-ref-titulo">REFERÊNCIAS</p>' + pop.referencias.map(function (r) { return '<p class="abnt-ref">' + esc(r).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>") + "</p>"; }).join("");
    main.innerHTML = barraImpressao(c, 2, pop.id) +
      '<p class="nao-imprimir acoes" style="margin:-6px 0 18px"><a class="btn btn-linha btn-p" href="' + arq + '.docx">Baixar em Word</a><a class="btn btn-linha btn-p" href="' + arq + '.pdf">Baixar em PDF</a><a class="btn btn-linha btn-p" href="materiais/planilhas/' + pop.planilha + '" download>Planilha deste POP</a></p>' +
      '<table class="abnt-moldura"><thead><tr><td>' + timbradoTopo(pop.id) + '</td></tr></thead><tfoot><tr><td>' + timbradoRodape() + '</td></tr></tfoot><tbody><tr><td><article class="doc-abnt">' + corpo + "</article></td></tr></tbody></table>";
  };

  // ---------- Apostila do módulo ----------
  P.views.modulo = function (main, id, q) {
    var m = C.modulos.filter(function (x) { return x.id === id; })[0];
    if (!m) return P.views.naoEncontrado(main);
    var c = q.get("c") ? S.cliente(q.get("c")) : null;
    var min = Math.round(m.horas * 60 / (m.topicos.length + 1));
    main.innerHTML = barraImpressao(c, 6, m.titulo) +
      '<article class="doc"><div class="doc-cab"><div><small>Apostila de treinamento</small><h1>' + esc(m.titulo) + "</h1><small>Carga horária: " + m.horas + " horas</small></div>" +
      '<div style="text-align:right"><small>Turma</small><b>' + esc(c ? c.empresa : "Modelo") + "</b><small style=\"margin-top:6px\">Instrutor</small><b>" + esc(K.nome) + "</b></div></div>" +
      "<h2>Ao final você vai conseguir</h2><p>" + esc(m.objetivo) + "</p>" +
      "<h2>Roteiro</h2><table><thead><tr><th>Tempo</th><th>Conteúdo</th></tr></thead><tbody>" +
      m.topicos.map(function (t) { return "<tr><td>" + min + " min</td><td>" + esc(t) + "</td></tr>"; }).join("") +
      "<tr><td>" + min + " min</td><td>Exercícios práticos com os dados da empresa</td></tr></tbody></table>" +
      "<h2>Exercícios</h2><ol>" + m.exercicios.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>" +
      (m.arquivo ? '<p class="muted pequeno">Arquivo dos exercícios: materiais/' + esc(m.arquivo) + "</p>" : "") +
      "<h2>Avaliação do treinamento</h2><table><tbody>" +
      ["O conteúdo vai ser útil no meu trabalho", "Os exercícios foram claros", "Consigo aplicar sozinho"].map(function (t) { return "<tr><td>" + t + "</td><td>( ) Discordo  ( ) Neutro  ( ) Concordo</td></tr>"; }).join("") +
      "</tbody></table><p style=\"margin-top:12px\">O que posso fazer diferente amanhã: ________________________________________________</p></article>";
  };

  // ---------- Certificados ----------
  P.views.certificado = function (main, _, q) {
    var c = q.get("c") ? S.cliente(q.get("c")) : null;
    var m = C.modulos.filter(function (x) { return x.id === q.get("m"); })[0] || C.modulos[0];
    var nomes = c && c.participantes && c.participantes.length ? c.participantes : ["Nome do participante"];
    main.innerHTML = barraImpressao(c, 6, "Certificados") +
      '<p class="nao-imprimir muted" style="margin-bottom:14px">' + nomes.length + " certificado(s). Na impressão, escolha orientação paisagem.</p>" +
      nomes.map(function (n) {
        return '<section class="certificado"><small class="muted">Certificado de participação</small><h1>Certificado</h1><p>Certificamos que</p><p class="nome">' + esc(n) + "</p>" +
          "<p>participou do treinamento <b>" + esc(m.titulo) + "</b>, com carga horária de " + m.horas + " horas" + (c ? ", realizado para <b>" + esc(c.empresa) + "</b>" : "") + ", em " + P.dataBR(P.hoje()) + ".</p>" +
          '<div class="assinatura">' + esc(K.nome) + "<br><span class=\"muted\">Instrutor</span></div></section>";
      }).join("");
  };

  // ---------- Dados do exemplo para os dashboards ----------
  function agregados() {
    if (agregados.cache) return agregados.cache;
    var meses = D.ruptura.map(function (r) { return r.mes; });
    var produtos = D.produtos.map(function (p) {
      var sit = p.estoque_atual === 0 ? "Zerado" : p.estoque_atual < p.ponto_pedido ? "Comprar" : "OK";
      return Object.assign({ situacao: sit, valorAno: p.consumo_dia * 365 * p.preco }, p);
    });
    var ordem = produtos.slice().sort(function (a, b) { return b.valorAno - a.valorAno; }), tot = ordem.reduce(function (t, p) { return t + p.valorAno; }, 0), ac = 0;
    ordem.forEach(function (p) { ac += p.valorAno; p.abc = ac / tot <= 0.8 ? "A" : ac / tot <= 0.95 ? "B" : "C"; });
    return (agregados.cache = { meses: meses, produtos: produtos });
  }
  function soma(lista, campo) { return lista.reduce(function (t, x) { return t + x[campo]; }, 0); }
  function agrupar(lista, chave, campo) {
    var m = {}; lista.forEach(function (x) { m[x[chave]] = (m[x[chave]] || 0) + x[campo]; });
    return Object.keys(m).map(function (k) { return { rotulo: k, valor: m[k] }; }).sort(function (a, b) { return b.valor - a.valor; });
  }
  function kpi(r, v, s) { return '<div class="kpi"><span>' + r + "</span><b>" + v + "</b>" + (s ? "<small>" + s + "</small>" : "") + "</div>"; }
  function cabDash(titulo, sub) {
    return '<p class="migalha"><a href="#/biblioteca/3">Materiais</a> / ' + titulo + "</p>" +
      '<div class="topo"><div><h1>' + titulo + "</h1><p>" + sub + ' Dados fictícios de um mercado de bairro. A linha tracejada marca o início da consultoria (abril de 2026).</p></div><div class="acoes"><a class="btn btn-linha" href="materiais/powerbi/kit-power-bi.zip" download>Baixar kit Power BI</a></div></div>';
  }
  function tabelaItens(lista) {
    return '<div class="tabela-wrap"><table class="pequeno"><thead><tr><th>Produto</th><th class="num">Estoque</th><th class="num">Ponto de pedido</th><th>Situação</th></tr></thead><tbody>' +
      lista.map(function (p) { return "<tr><td>" + esc(p.produto) + '</td><td class="num">' + p.estoque_atual + '</td><td class="num">' + p.ponto_pedido + '</td><td><span class="etq ' + (p.situacao === "Zerado" ? "etq-alto" : "etq-medio") + '">' + p.situacao + "</span></td></tr>"; }).join("") + "</tbody></table></div>";
  }
  var iProjeto = function (meses) { return meses.indexOf(D.inicio_projeto); };

  // ---------- Dashboard simples ----------
  P.views.dashSimples = function (main) {
    var A = agregados(), v = D.vendas_mes, fat = soma(v, "faturamento"), cus = soma(v, "custo");
    var porMes = A.meses.map(function (m) { var l = v.filter(function (x) { return x.mes === m; }); return { x: P.mesCurto(m), y: soma(l, "faturamento") }; });
    var rup = D.ruptura, antes = rup.filter(function (r) { return r.mes < D.inicio_projeto; }), mediaAntes = soma(antes, "ruptura") / antes.length, ult = rup[rup.length - 1];
    var criticos = A.produtos.filter(function (p) { return p.situacao !== "OK"; }).sort(function (a, b) { return (a.situacao === "Zerado" ? 0 : 1) - (b.situacao === "Zerado" ? 0 : 1); });
    main.innerHTML = cabDash("Dashboard simples", "Modelo do serviço 4: uma página com o essencial.") +
      '<div class="kpis">' + kpi("Faturamento em 12 meses", G.fmt.mil(fat), "out/25 a set/26") + kpi("Margem bruta", G.fmt.pct((fat - cus) / fat), "sobre o faturamento") +
      kpi("Ruptura em " + P.mesCurto(ult.mes), G.fmt.pct(ult.ruptura), "antes do projeto: " + G.fmt.pct(mediaAntes)) + kpi("Itens para comprar", criticos.length, criticos.filter(function (p) { return p.situacao === "Zerado"; }).length + " zerado(s)") + "</div>" +
      '<div class="grade g2"><section class="cartao"><h3>Faturamento mensal</h3>' + G.linha(porMes, { formato: G.fmt.mil, marco: iProjeto(A.meses), marcoTexto: "início da consultoria", passo: 2, titulo: "Faturamento mensal", largura: 520 }) + "</section>" +
      '<section class="cartao"><h3>Ruptura caiu de ' + G.fmt.pct(mediaAntes) + " para " + G.fmt.pct(ult.ruptura) + "</h3>" + G.linha(rup.map(function (r) { return { x: P.mesCurto(r.mes), y: r.ruptura }; }), { formato: G.fmt.pct, marco: iProjeto(A.meses), marcoTexto: "início da consultoria", passo: 2, min: 0, max: 0.16, titulo: "Ruptura mensal", cor: "var(--critico)", largura: 520 }) + "</section></div>" +
      '<div class="grade g2 secao"><section class="cartao"><h3>Faturamento por categoria</h3>' + G.barras(agrupar(v, "categoria", "faturamento").map(function (x, i) { return { rotulo: x.rotulo, valor: x.valor, cor: i === 0 ? "var(--g-destaque)" : undefined }; }), { formato: G.fmt.mil, rotulo: 110, largura: 520 }) + "</section>" +
      '<section class="cartao"><h3>Itens no ponto de pedido ou zerados</h3>' + tabelaItens(criticos.slice(0, 8)) + "</section></div>";
  };

  // ---------- Dashboard completo ----------
  P.views.dashCompleto = function (main, aba) {
    var A = agregados(), aba0 = aba || "vendas";
    var opMes = A.meses.map(function (m) { return '<option value="' + m + '">' + P.mesCurto(m) + "</option>"; }).join("");
    main.innerHTML = cabDash("Dashboard completo", "Modelo do serviço 5: três páginas com filtros.") +
      '<div class="filtros"><div class="campo"><label for="f-de">De</label><select id="f-de">' + opMes + '</select></div><div class="campo"><label for="f-ate">Até</label><select id="f-ate">' + opMes + "</select></div>" +
      '<div class="campo"><label for="f-canal">Canal de venda</label><select id="f-canal"><option value="">Todos</option><option>Loja</option><option>WhatsApp</option><option>Online</option></select></div></div>' +
      '<div class="abas" role="tablist">' + [["vendas", "Vendas"], ["estoque", "Estoque"], ["financeiro", "Financeiro"]].map(function (a) { return '<button role="tab" data-aba="' + a[0] + '" aria-selected="' + (a[0] === aba0) + '">' + a[1] + "</button>"; }).join("") + "</div><div id=\"pagina\"></div>";
    P.$("#f-ate").value = A.meses[A.meses.length - 1];
    var atual = aba0;
    function desenhar() {
      var de = P.$("#f-de").value, ate = P.$("#f-ate").value, canal = P.$("#f-canal").value;
      if (de > ate) { var t = de; de = ate; ate = t; }
      var meses = A.meses.filter(function (m) { return m >= de && m <= ate; });
      var v = D.vendas_mes.filter(function (x) { return x.mes >= de && x.mes <= ate && (!canal || x.canal === canal); });
      var alvo = P.$("#pagina"), ip = meses.indexOf(D.inicio_projeto);
      if (atual === "vendas") {
        var fat = soma(v, "faturamento"), cus = soma(v, "custo"), q = soma(v, "quantidade");
        alvo.innerHTML = '<div class="kpis">' + kpi("Faturamento", G.fmt.mil(fat)) + kpi("Margem bruta", G.fmt.pct(fat ? (fat - cus) / fat : 0)) + kpi("Itens vendidos", G.fmt.num(q)) + kpi("Preço médio por item", "R$ " + (q ? fat / q : 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })) + "</div>" +
          '<section class="cartao"><h3>Faturamento mensal' + (canal ? " (" + esc(canal) + ")" : "") + "</h3>" + G.linha(meses.map(function (m) { return { x: P.mesCurto(m), y: soma(v.filter(function (x) { return x.mes === m; }), "faturamento") }; }), { formato: G.fmt.mil, marco: ip >= 0 ? ip : null, marcoTexto: "início da consultoria", passo: meses.length > 8 ? 2 : 1 }) + "</section>" +
          '<div class="grade g3 secao"><section class="cartao"><h3>Por canal</h3>' + G.barras(agrupar(v, "canal", "faturamento"), { formato: G.fmt.mil, rotulo: 90, largura: 380 }) + "</section>" +
          '<section class="cartao"><h3>Por vendedor</h3>' + G.barras(agrupar(v, "vendedor", "faturamento"), { formato: G.fmt.mil, rotulo: 70, largura: 380 }) + "</section>" +
          '<section class="cartao"><h3>Por categoria</h3>' + G.barras(agrupar(v, "categoria", "faturamento"), { formato: G.fmt.mil, rotulo: 100, largura: 380 }) + "</section></div>";
      } else if (atual === "estoque") {
        var pr = A.produtos, rup = D.ruptura.filter(function (r) { return r.mes >= de && r.mes <= ate; });
        var valor = pr.reduce(function (t, p) { return t + p.estoque_atual * p.custo; }, 0);
        var porCat = {}; pr.forEach(function (p) { porCat[p.categoria] = (porCat[p.categoria] || 0) + p.estoque_atual * p.custo; });
        var abc = ["A", "B", "C"].map(function (k) { var l = pr.filter(function (p) { return p.abc === k; }); return { k: k, n: l.length, v: l.reduce(function (t, p) { return t + p.valorAno; }, 0) }; });
        var totAbc = abc.reduce(function (t, x) { return t + x.v; }, 0);
        alvo.innerHTML = '<div class="kpis">' + kpi("Itens cadastrados", pr.length) + kpi("Zerados", pr.filter(function (p) { return p.situacao === "Zerado"; }).length) + kpi("Para comprar", pr.filter(function (p) { return p.situacao === "Comprar"; }).length) + kpi("Valor em estoque", G.fmt.brl(valor), "a preço de custo") + "</div>" +
          '<div class="grade g2"><section class="cartao"><h3>Ruptura mensal</h3>' + G.linha(rup.map(function (r) { return { x: P.mesCurto(r.mes), y: r.ruptura }; }), { formato: G.fmt.pct, min: 0, max: 0.16, marco: ip >= 0 ? ip : null, marcoTexto: "início da consultoria", cor: "var(--critico)", passo: rup.length > 8 ? 2 : 1, largura: 520 }) + "</section>" +
          '<section class="cartao"><h3>Valor parado em estoque por categoria</h3>' + G.barras(Object.keys(porCat).map(function (k) { return { rotulo: k, valor: porCat[k] }; }).sort(function (a, b) { return b.valor - a.valor; }), { formato: G.fmt.brl, rotulo: 100, largura: 520 }) + "</section></div>" +
          '<div class="grade g2 secao"><section class="cartao"><h3>Curva ABC</h3><p>Poucos itens (A) concentram a maior parte da venda. Conte esses toda semana.</p><div class="tabela-wrap" style="margin-top:12px"><table><thead><tr><th>Classe</th><th class="num">Itens</th><th class="num">Parte da venda</th></tr></thead><tbody>' +
          abc.map(function (x) { return "<tr><td>" + x.k + '</td><td class="num">' + x.n + '</td><td class="num">' + G.fmt.pct(x.v / totAbc) + "</td></tr>"; }).join("") + "</tbody></table></div></section>" +
          '<section class="cartao"><h3>Itens críticos</h3>' + tabelaItens(pr.filter(function (p) { return p.situacao !== "OK"; }).slice(0, 8)) + "</section></div>";
      } else {
        var fl = D.fluxo.filter(function (x) { return x.mes >= de && x.mes <= ate; });
        var saidas = function (x) { return x.compras + x.folha + x.aluguel + x.energia + x.impostos + x.marketing + x.outras; };
        var ent = soma(fl, "entradas"), sai = fl.reduce(function (t, x) { return t + saidas(x); }, 0);
        var desp = ["compras", "folha", "aluguel", "impostos", "energia", "marketing", "outras"].map(function (k) { return { rotulo: { compras: "Compras", folha: "Folha", aluguel: "Aluguel", impostos: "Impostos", energia: "Energia", marketing: "Marketing", outras: "Outras" }[k], valor: soma(fl, k) }; }).sort(function (a, b) { return b.valor - a.valor; });
        alvo.innerHTML = '<div class="kpis">' + kpi("Entradas", G.fmt.mil(ent)) + kpi("Saídas", G.fmt.mil(sai)) + kpi("Resultado", G.fmt.mil(ent - sai)) + kpi("Margem líquida", G.fmt.pct(ent ? (ent - sai) / ent : 0)) + "</div>" +
          '<section class="cartao"><h3>Entradas e saídas por mês</h3>' + G.colunas(fl.map(function (x) { return { x: P.mesCurto(x.mes), valores: [x.entradas, saidas(x)] }; }), [{ nome: "Entradas", cor: "var(--g-destaque)" }, { nome: "Saídas", cor: "var(--g-cinza)" }], { formato: G.fmt.mil, passo: fl.length > 8 ? 2 : 1 }) + "</section>" +
          '<div class="grade g2 secao"><section class="cartao"><h3>Resultado mensal</h3>' + G.linha(fl.map(function (x) { return { x: P.mesCurto(x.mes), y: x.entradas - saidas(x) }; }), { formato: G.fmt.mil, passo: fl.length > 8 ? 2 : 1, min: Math.min(0, Math.min.apply(null, fl.map(function (x) { return x.entradas - saidas(x); }))), largura: 520 }) + "</section>" +
          '<section class="cartao"><h3>Para onde vai o dinheiro</h3>' + G.barras(desp, { formato: G.fmt.mil, rotulo: 90, largura: 520 }) + "</section></div>";
      }
    }
    P.$$(".abas button", main).forEach(function (b) {
      b.addEventListener("click", function () { atual = b.dataset.aba; P.$$(".abas button", main).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); }); desenhar(); });
    });
    ["f-de", "f-ate", "f-canal"].forEach(function (i) { P.$("#" + i).addEventListener("change", desenhar); });
    desenhar();
  };

  // ---------- Biblioteca geral ----------
  P.views.biblioteca = function (main, etapa) {
    var sel = +etapa || 0;
    function lista(n) {
      if (n === 1) return '<p>O questionário tem ' + C.perguntas.filter(function (p) { return !p.tipos; }).length + " perguntas gerais e outras específicas por tipo de empresa. Ele fica dentro de cada cliente: abra um cliente e vá à etapa 1.</p>" +
        '<div class="acoes" style="margin-top:12px"><a class="btn btn-linha btn-p" href="#/clientes">Escolher cliente</a></div>';
      if (n === 2) return C.pops.map(function (p) { var a = "materiais/pops/" + arquivoPop(p); return '<div class="material"><div><b>' + p.id + " " + esc(p.titulo) + "</b><p>" + esc(p.objetivo) + '</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/pop/' + p.id + '">Abrir POP</a><a class="btn btn-linha btn-p" href="' + a + '.docx">Word</a><a class="btn btn-linha btn-p" href="' + a + '.pdf">PDF</a><a class="btn btn-linha btn-p" href="materiais/planilhas/' + p.planilha + '" download>Planilha</a></div></div>'; }).join("") + '<p class="muted pequeno" style="margin-top:12px">POPs no padrão ABNT (Arial 12, margens 3 e 2 cm, espaçamento 1,5), no seu timbrado. As planilhas de gestão (precificação, 5W2H, 4 Ps, PDCA e SWOT) estão em <a href="#/ferramentas">Ferramentas</a>.</p>';
      if (n === 3) return '<div class="material"><div><b>Dashboard simples</b><p>Uma página com o essencial.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/dashboard/simples">Abrir</a></div></div>' +
        '<div class="material"><div><b>Dashboard completo</b><p>Vendas, estoque e financeiro com filtros.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/dashboard/completo">Abrir</a></div></div>' +
        '<div class="material"><div><b>Kit Power BI</b><p>CSVs, medidas DAX, tema e passo a passo.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="materiais/powerbi/kit-power-bi.zip" download>Baixar</a></div></div>' +
        '<details class="guia"><summary>Passo a passo da integração de dados</summary><ol>' + C.integracao.map(function (s) { return "<li><b>" + esc(s.titulo) + ".</b> " + esc(s.texto) + "</li>"; }).join("") + "</ol></details>";
      if (n === 4) return C.automacoes.map(function (a) { return '<details class="guia"><summary>' + a.n + " " + esc(a.titulo) + '</summary><p class="muted pequeno" style="margin-top:8px">Quando usar: ' + esc(a.quando) + "</p><ol>" + a.passos.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" + (a.arquivo ? '<a class="btn btn-linha btn-p" href="materiais/' + a.arquivo + '" download>Baixar modelo</a>' : "") + "</details>"; }).join("");
      if (n === 5) return '<div class="tabela-wrap"><table><thead><tr><th>Plano</th><th>Inclui</th><th class="num">Brasil (R$/mês)</th></tr></thead><tbody>' + Object.keys(C.planos).map(function (k) { var p = C.planos[k]; return "<tr><td><b>" + p.nome + "</b></td><td>" + esc(p.inclui) + '</td><td class="num faixa">' + p.min.toLocaleString("pt-BR") + " a " + p.max.toLocaleString("pt-BR") + "</td></tr>"; }).join("") + '</tbody></table></div><p class="muted pequeno" style="margin-top:10px">A agenda, as reuniões, os indicadores e os avisos ficam em Acompanhamento e na etapa 5 de cada cliente.</p>';
      return C.modulos.map(function (m) { return '<div class="material"><div><b>' + esc(m.titulo) + " (" + m.horas + " h)</b><p>" + esc(m.objetivo) + '</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/modulo/' + m.id + '">Apostila</a></div></div>'; }).join("") +
        '<div class="material"><div><b>Certificado</b><p>Modelo para imprimir. Com um cliente, sai com o nome de cada participante.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/certificado?m=m1">Ver modelo</a></div></div>';
    }
    main.innerHTML = '<div class="topo"><div><h1>Materiais</h1><p>Tudo o que cada etapa entrega. Dentro de um cliente, os mesmos materiais saem com o nome dele e na ordem das prioridades do diagnóstico.</p></div></div>' +
      C.etapas.filter(function (e) { return !sel || e.n === sel; }).map(function (e) {
        return '<section class="cartao" id="etapa-' + e.n + '"><h2>' + e.n + ". " + e.nome + "</h2><p>" + esc(e.resumo) + '</p><div style="margin-top:12px">' + lista(e.n) + "</div></section>";
      }).join("") + (sel ? '<p style="margin-top:16px"><a href="#/biblioteca">Ver todas as etapas</a></p>' : "");
  };

  // ---------- Configurações ----------
  P.views.config = function (main) {
    var st = S.get();
    main.innerHTML = '<div class="topo"><div><h1>Configurações</h1><p>Os clientes ficam guardados só neste navegador e neste computador. Baixe um backup toda semana e guarde no Google Drive ou no OneDrive.</p></div></div>' +
      '<section class="cartao"><h2>Backup</h2><p>' + st.clientes.length + " cliente(s)" + (st.atualizadoEm ? ", última alteração em " + new Date(st.atualizadoEm).toLocaleDateString("pt-BR") : "") + '.</p><div class="acoes" style="margin-top:14px"><button class="btn btn-sinal" id="exportar">Baixar backup</button>' +
      '<label class="btn btn-linha" for="importar">Restaurar backup</label><input type="file" id="importar" accept=".json,application/json" hidden></div><p class="muted pequeno" style="margin-top:10px">Restaurar substitui todos os clientes deste navegador pelos do arquivo. Para usar em outro computador, baixe o backup aqui e restaure lá.</p></section>' +
      '<section class="cartao"><h2>Dados de exemplo</h2><p>Seis clientes fictícios em etapas diferentes, para demonstrar o painel.</p><div class="acoes" style="margin-top:14px"><button class="btn btn-linha" id="exemplo">Carregar exemplo</button><button class="btn btn-perigo" id="zerar">Apagar todos os clientes</button></div></section>';
    P.$("#exportar").addEventListener("click", function () { P.baixar("painel-consultoria-backup-" + P.hoje() + ".json", S.exportar()); P.toast("Backup baixado"); });
    P.$("#importar").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { if (!confirm("Substituir os clientes atuais pelos do arquivo?")) return; S.importar(r.result); P.toast("Backup restaurado"); location.hash = "#/clientes"; P.atualizarCasca(); }
        catch (err) { alert("Não foi possível ler o arquivo: " + err.message); }
      };
      r.readAsText(f);
    });
    P.$("#exemplo").addEventListener("click", function () { if (confirm("Trocar os clientes atuais pelos de exemplo?")) { S.exemplo(); P.toast("Exemplo carregado"); location.hash = "#/"; P.atualizarCasca(); } });
    P.$("#zerar").addEventListener("click", function () { if (confirm("Apagar todos os clientes deste navegador? Baixe um backup antes.")) { S.zerar(); P.toast("Clientes apagados"); location.hash = "#/"; P.atualizarCasca(); } });
  };
})(window.P);
