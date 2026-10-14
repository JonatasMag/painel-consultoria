/* =============================================================
 * AS 6 ETAPAS DENTRO DA PÁGINA DO CLIENTE
 * + questionário de diagnóstico e relatório.
 * ============================================================= */
(function (P) {
  "use strict";
  var C = window.CONTEUDO, S = window.Store, G = window.Graf, esc = P.esc;

  function entregue(c, chave) { return c.entregas[chave]; }
  function checkEntrega(c, chave, rotulo) {
    var d = entregue(c, chave);
    return '<label class="check pequeno"><input type="checkbox" data-entrega="' + chave + '"' + (d ? " checked" : "") + "><span>" + (rotulo || "Entregue") + (d ? ' <span class="muted">em ' + P.dataBR(d) + "</span>" : "") + "</span></label>";
  }
  function precos(nums, reg) {
    return '<div class="tabela-wrap" style="margin-top:14px"><table><thead><tr><th>Serviço</th><th>Prazo</th><th class="num">Faixa de preço (' + C.regioes[reg].nome + ")</th></tr></thead><tbody>" +
      nums.map(function (n) { var s = C.servicos[n]; return "<tr><td>" + n + " " + esc(s.nome) + "</td><td>" + esc(s.prazo) + '</td><td class="num faixa">' + P.faixaServico(n, reg) + "</td></tr>"; }).join("") +
      "</tbody></table></div>";
  }

  P.etapaPainel = function (box, c, n, refazer) {
    var e = C.etapas[n - 1], st = c.etapas[n], reg = P.regiao(c);
    var acoes = st.status === "bloqueada"
      ? '<button class="btn btn-sinal" data-acao="liberar">Liberar etapa ' + n + "</button>"
      : st.status === "liberada"
        ? '<button class="btn" data-acao="concluir">Marcar como concluída</button><button class="btn btn-linha btn-p" data-acao="bloquear">Desfazer liberação</button>'
        : '<button class="btn btn-linha" data-acao="reabrir">Reabrir etapa</button>';
    var datas = st.liberadaEm ? '<p class="muted pequeno" style="margin-top:6px">Liberada em ' + P.dataBR(st.liberadaEm) + (st.concluidaEm ? ", concluída em " + P.dataBR(st.concluidaEm) : "") + "</p>" : "";
    var corpo = { 1: etapa1, 2: etapa2, 3: etapa3, 4: etapa4, 5: etapa5, 6: etapa6 }[n](c, reg);
    box.innerHTML =
      '<section class="cartao"><div class="topo" style="margin-bottom:6px"><div><h2>Etapa ' + n + ": " + e.nome + "</h2><p>" + esc(e.resumo) + "</p>" + datas + '</div><div class="acoes">' + acoes + "</div></div>" +
      (st.status === "bloqueada" ? '<p class="muted pequeno" style="margin-top:10px">Os materiais abaixo já podem ser consultados. Libere a etapa quando combinar com o cliente.</p>' : "") +
      precos(e.servicos, reg) + "</section>" + corpo;

    P.$$("[data-acao]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.acao;
        if (a === "liberar") { P.liberar(c, n, false); P.toast("Etapa " + n + " liberada"); }
        if (a === "concluir") { P.concluir(c, n); P.toast("Etapa " + n + " concluída"); }
        if (a === "reabrir") { P.reabrir(c, n); P.toast("Etapa " + n + " reaberta"); }
        if (a === "bloquear") { if (!confirm("Voltar a etapa " + n + " para não liberada?")) return; P.bloquear(c, n); }
        refazer();
      });
    });
    P.$$("[data-entrega]", box).forEach(function (ch) {
      ch.addEventListener("change", function () {
        if (ch.checked) c.entregas[ch.dataset.entrega] = P.hoje(); else delete c.entregas[ch.dataset.entrega];
        S.salvar(); refazer();
      });
    });
    if (n === 5) ligarEtapa5(box, c, refazer);
    if (n === 6) ligarEtapa6(box, c, refazer);
  };

  // ---------- 1. Diagnosticar ----------
  function etapa1(c) {
    var p = P.pontuar(c);
    if (!p) return '<section class="cartao"><h3>Diagnóstico</h3><p>Preencha o questionário com o cliente (cerca de 15 minutos). O relatório sai pronto para imprimir ou salvar em PDF.</p>' +
      '<div class="acoes" style="margin-top:16px"><a class="btn btn-sinal" href="#/cliente/' + c.id + '/diagnostico">Preencher diagnóstico</a></div></section>';
    return '<section class="cartao"><div class="topo" style="margin-bottom:8px"><div><h3>Diagnóstico de ' + P.dataBR(c.diagnostico.data) + '</h3><p>Nota geral <b>' + p.geral + " de 100</b>.</p></div>" +
      '<div class="acoes"><a class="btn btn-sinal" href="#/cliente/' + c.id + '/relatorio">Ver relatório</a><a class="btn btn-linha" href="#/cliente/' + c.id + '/diagnostico">Refazer</a></div></div>' +
      G.barras(p.lista.map(function (a) { return { rotulo: a.nome, valor: a.nota, cor: P.corNota(a.nota) }; }), { max: 100, formato: function (v) { return v + " de 100"; }, titulo: "Nota por área" }) +
      '<div style="margin-top:12px">' + checkEntrega(c, "relatorio", "Relatório entregue ao cliente") + "</div></section>";
  }

  // ---------- 2. Organizar ----------
  function etapa2(c) {
    var p = P.pontuar(c), nota = {};
    if (p) p.lista.forEach(function (a) { nota[a.area] = a.nota; });
    var pops = C.pops.slice().sort(function (a, b) { return (nota[a.area] != null ? nota[a.area] : 100) - (nota[b.area] != null ? nota[b.area] : 100); });
    return '<section class="cartao"><h3>Procedimentos padrão (POPs)</h3><p>' + (p ? "Ordenados pelas áreas com nota mais baixa no diagnóstico." : "Preencha o diagnóstico para ordenar pelas prioridades do cliente.") + " Cada POP já sai com o nome do cliente.</p>" +
      pops.map(function (pop) {
        var pl = C.planilhas.filter(function (x) { return x.arquivo === pop.planilha; })[0];
        return '<div class="material"><div><b>' + pop.id + " " + esc(pop.titulo) + "</b><p>" + esc(pop.objetivo) + (nota[pop.area] != null ? " Nota da área: " + nota[pop.area] + "." : "") + "</p>" + checkEntrega(c, pop.id) + "</div>" +
          '<div class="acoes"><a class="btn btn-linha btn-p" href="#/pop/' + pop.id + "?c=" + c.id + '">Abrir POP</a><a class="btn btn-linha btn-p" href="materiais/planilhas/' + pop.planilha + '" download>Planilha: ' + esc(pl.nome) + "</a></div></div>";
      }).join("") + "</section>" +
      '<section class="cartao"><h3>Todas as planilhas</h3><p>Excel com dados fictícios e fórmulas prontas. Apague os dados de exemplo e coloque os do cliente.</p>' +
      C.planilhas.map(function (pl) {
        return '<div class="material"><div><b>' + esc(pl.nome) + "</b><p>" + esc(pl.desc) + "</p>" + checkEntrega(c, "pl-" + pl.arquivo) + '</div><div class="acoes"><a class="btn btn-linha btn-p" href="materiais/planilhas/' + pl.arquivo + '" download>Baixar .xlsx</a></div></div>';
      }).join("") + "</section>";
  }

  // ---------- 3. Medir ----------
  function etapa3(c) {
    return '<section class="cartao"><h3>Modelos de dashboard</h3><p>Abra com o cliente para mostrar o resultado esperado. Os números são de um mercado fictício.</p>' +
      '<div class="material"><div><b>4 Dashboard simples</b><p>Uma página: faturamento, margem, ruptura e itens para comprar.</p>' + checkEntrega(c, "dash-simples") + '</div><div class="acoes"><a class="btn btn-linha btn-p" href="#/dashboard/simples">Abrir modelo</a></div></div>' +
      '<div class="material"><div><b>5 Dashboard completo</b><p>Três páginas (vendas, estoque e financeiro) com filtros de período e canal.</p>' + checkEntrega(c, "dash-completo") + '</div><div class="acoes"><a class="btn btn-linha btn-p" href="#/dashboard/completo">Abrir modelo</a></div></div>' +
      '<div class="material"><div><b>Kit Power BI</b><p>Tabelas em CSV (valores em centavos), medidas DAX, tema de cores e o passo a passo de montagem.</p>' + checkEntrega(c, "kit-pbi") + '</div><div class="acoes"><a class="btn btn-linha btn-p" href="materiais/powerbi/kit-power-bi.zip" download>Baixar kit (.zip)</a></div></div></section>' +
      '<section class="cartao"><h3>6 Integração de dados: passo a passo</h3><p>Marque cada passo conforme avança com este cliente.</p><ol style="margin:14px 0 0;padding-left:0;list-style:none;display:grid;gap:12px">' +
      C.integracao.map(function (s, i) {
        var k = "integ-" + i, d = entregue(c, k);
        return '<li><label class="check"><input type="checkbox" data-entrega="' + k + '"' + (d ? " checked" : "") + "><span><b>" + (i + 1) + ". " + esc(s.titulo) + "</b><br>" + esc(s.texto) + (d ? ' <span class="muted pequeno">(feito em ' + P.dataBR(d) + ")</span>" : "") + "</span></label></li>";
      }).join("") + "</ol></section>";
  }

  // ---------- 4. Automatizar ----------
  function etapa4(c) {
    var rec = P.recomendar(c);
    var lista = C.automacoes.slice().sort(function (a, b) { return (rec.indexOf(a.n) === -1 ? 99 : rec.indexOf(a.n)) - (rec.indexOf(b.n) === -1 ? 99 : rec.indexOf(b.n)); });
    return '<section class="cartao"><h3>Modelos de automação</h3><p>Os recomendados para ' + esc(C.tipos[c.tipo].nome.toLowerCase()) + " aparecem primeiro. Abra cada um para ver o passo a passo.</p>" +
      lista.map(function (a, i) {
        var k = "auto-" + i + "-" + a.n;
        k = "auto-" + a.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
        return '<details class="guia"><summary><span>' + a.n + " " + esc(a.titulo) + (rec.indexOf(a.n) !== -1 ? ' <span class="etq etq-liberada">Recomendado</span>' : "") + "</span></summary>" +
          '<p class="muted pequeno" style="margin-top:8px">Quando usar: ' + esc(a.quando) + "</p><ol>" + a.passos.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
          '<div class="acoes" style="margin-top:8px;align-items:center">' + (a.arquivo ? '<a class="btn btn-linha btn-p" href="materiais/' + a.arquivo + '" download>Baixar modelo</a>' : "") + checkEntrega(c, k, "Implantado") + "</div></details>";
      }).join("") + "</section>";
  }

  // ---------- 5. Acompanhar ----------
  function etapa5(c, reg) {
    var pl = c.plano || {}, sug = P.planoSugerido(c);
    var nomes = [];
    c.indicadores.forEach(function (x) { if (nomes.indexOf(x.nome) === -1) nomes.push(x.nome); });
    var reunioes = c.reunioes.slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; });
    var av = P.avisosDe(c);
    return '<section class="cartao"><h3>Avisos deste cliente</h3><div style="margin-top:12px">' + P.htmlAvisos(av, "Nada pendente para este cliente.") + "</div></section>" +
      '<section class="cartao"><h3>Plano mensal</h3><p>Sugestão pelo diagnóstico: <b>' + C.planos[sug].nome + "</b> (" + P.faixa(C.planos[sug].min, C.planos[sug].max, reg) + " por mês).</p>" +
      '<form id="form-plano" class="campos" style="margin-top:16px"><div class="campo"><label for="pl-tipo">Plano</label><select id="pl-tipo"><option value="">Sem plano</option>' +
      Object.keys(C.planos).map(function (k) { return '<option value="' + k + '"' + (pl.tipo === k ? " selected" : "") + ">" + C.planos[k].nome + " (" + P.faixa(C.planos[k].min, C.planos[k].max, reg) + ")</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="pl-valor">Valor mensal (R$)</label><input type="number" id="pl-valor" min="0" step="50" value="' + (pl.valor || "") + '"></div>' +
      '<div class="campo"><label for="pl-inicio">Início</label><input type="date" id="pl-inicio" value="' + (pl.inicio || "") + '"></div>' +
      '<div class="campo"><label for="pl-dia">Dia da reunião mensal</label><input type="number" id="pl-dia" min="1" max="28" value="' + (pl.diaReuniao || 10) + '"></div>' +
      '<div class="campo largo"><p class="muted pequeno" id="pl-inclui">' + (pl.tipo ? "Inclui: " + esc(C.planos[pl.tipo].inclui) : "") + '</p><div class="acoes"><button class="btn" type="submit">Salvar plano</button></div></div></form></section>' +
      '<section class="cartao"><h3>Reuniões mensais</h3><form id="form-reuniao" class="campos" style="margin-top:14px"><div class="campo"><label for="re-data">Data</label><input type="date" id="re-data" value="' + P.hoje() + '"></div>' +
      '<div class="campo"><label for="re-nota">O que foi decidido</label><input type="text" id="re-nota" placeholder="Ex.: ruptura caiu para 6%; revisar compras de bebidas"></div>' +
      '<div class="campo largo"><label class="check"><input type="checkbox" id="re-feita" checked><span>Reunião realizada</span></label><div class="acoes" style="margin-top:8px"><button class="btn" type="submit">Registrar reunião</button></div></div></form>' +
      (reunioes.length ? '<ul style="margin:16px 0 0;padding-left:20px;display:grid;gap:6px">' + reunioes.map(function (r) { return "<li><b>" + P.dataBR(r.data) + "</b> " + (r.feita ? "" : '<span class="etq">Agendada</span> ') + esc(r.nota || "") + "</li>"; }).join("") + "</ul>" : "") + "</section>" +
      '<section class="cartao"><h3>Indicadores do cliente</h3><p>Lance os números de cada mês para mostrar a evolução na reunião.</p>' +
      '<form id="form-ind" class="campos" style="margin-top:14px"><div class="campo"><label for="in-mes">Mês</label><input type="month" id="in-mes" value="' + P.mesAnterior(P.hoje().slice(0, 7)) + '"></div>' +
      '<div class="campo"><label for="in-nome">Indicador</label><input type="text" id="in-nome" list="lista-ind" placeholder="Ex.: Ruptura (%)"><datalist id="lista-ind">' +
      nomes.concat(["Ruptura (%)", "Acuracidade (%)", "Faturamento (R$ mil)", "Ticket médio (R$)", "Margem (%)", "Leads no mês"]).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + "</datalist></div>" +
      '<div class="campo"><label for="in-valor">Valor</label><input type="number" id="in-valor" step="0.1"></div><div class="campo" style="align-self:end"><button class="btn" type="submit">Lançar</button></div></form>' +
      '<div class="grade g2" style="margin-top:18px">' + nomes.map(function (nome) {
        var pts = c.indicadores.filter(function (x) { return x.nome === nome; }).sort(function (a, b) { return a.mes < b.mes ? -1 : 1; });
        var f = function (v) { return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }); };
        return "<div><h4 style=\"font-size:15px\">" + esc(nome) + "</h4>" + (pts.length > 1
          ? G.linha(pts.map(function (x) { return { x: P.mesCurto(x.mes), y: x.valor }; }), { formato: f, altura: 200, titulo: nome, largura: 440, esq: 56 })
          : '<p class="muted pequeno">' + P.mesCurto(pts[0].mes) + ": " + f(pts[0].valor) + "</p>") + "</div>";
      }).join("") + "</div></section>";
  }
  function ligarEtapa5(box, c, refazer) {
    var tipoSel = P.$("#pl-tipo", box);
    tipoSel.addEventListener("change", function () {
      var k = tipoSel.value; P.$("#pl-inclui", box).textContent = k ? "Inclui: " + C.planos[k].inclui : "";
      if (k && !P.$("#pl-valor", box).value) P.$("#pl-valor", box).value = Math.round((C.planos[k].min * C.regioes[P.regiao(c)].fator) / 50) * 50;
    });
    P.$("#form-plano", box).addEventListener("submit", function (e) {
      e.preventDefault();
      c.plano = { tipo: tipoSel.value, valor: +P.$("#pl-valor", box).value || 0, inicio: P.$("#pl-inicio", box).value || (tipoSel.value ? P.hoje() : ""), diaReuniao: Math.min(28, Math.max(1, +P.$("#pl-dia", box).value || 10)) };
      S.salvar(); P.toast("Plano salvo"); refazer();
    });
    P.$("#form-reuniao", box).addEventListener("submit", function (e) {
      e.preventDefault();
      c.reunioes.push({ data: P.$("#re-data", box).value || P.hoje(), nota: P.$("#re-nota", box).value.trim(), feita: P.$("#re-feita", box).checked });
      S.salvar(); P.toast("Reunião registrada"); refazer();
    });
    P.$("#form-ind", box).addEventListener("submit", function (e) {
      e.preventDefault();
      var mes = P.$("#in-mes", box).value, nome = P.$("#in-nome", box).value.trim(), valor = parseFloat(P.$("#in-valor", box).value);
      if (!mes || !nome || isNaN(valor)) { P.toast("Preencha mês, indicador e valor"); return; }
      c.indicadores = c.indicadores.filter(function (x) { return !(x.mes === mes && x.nome === nome); });
      c.indicadores.push({ mes: mes, nome: nome, valor: valor });
      S.salvar(); P.toast("Indicador lançado"); refazer();
    });
  }

  // ---------- 6. Treinar ----------
  function etapa6(c) {
    return '<section class="cartao"><h3>Módulos de treinamento</h3><p>Cada módulo tem apostila para imprimir, roteiro e exercícios.</p>' +
      C.modulos.map(function (m) {
        return '<div class="material"><div><b>' + esc(m.titulo) + " (" + m.horas + " h)</b><p>" + esc(m.objetivo) + "</p>" + checkEntrega(c, "mod-" + m.id, "Aplicado") + "</div>" +
          '<div class="acoes"><a class="btn btn-linha btn-p" href="#/modulo/' + m.id + "?c=" + c.id + '">Abrir apostila</a>' + (m.arquivo ? '<a class="btn btn-linha btn-p" href="materiais/' + (m.arquivo.slice(-1) === "/" ? m.arquivo + "kit-power-bi.zip" : m.arquivo) + '" download>Exercícios</a>' : "") + "</div></div>";
      }).join("") + "</section>" +
      '<section class="cartao"><h3>Participantes e certificados</h3><p>Um nome por linha. Depois escolha o módulo e gere os certificados para imprimir.</p>' +
      '<form id="form-part" style="margin-top:14px"><div class="campo"><label for="part">Participantes</label><textarea id="part">' + esc((c.participantes || []).join("\n")) + "</textarea></div>" +
      '<div class="acoes" style="margin-top:12px;align-items:end"><button class="btn" type="submit">Salvar participantes</button>' +
      '<div class="campo" style="min-width:220px"><label for="cert-mod">Módulo do certificado</label><select id="cert-mod">' + C.modulos.map(function (m) { return '<option value="' + m.id + '">' + esc(m.titulo) + "</option>"; }).join("") + "</select></div>" +
      '<button class="btn btn-sinal" type="button" id="gerar-cert">Gerar certificados</button></div></form></section>';
  }
  function ligarEtapa6(box, c, refazer) {
    function salvar() { c.participantes = P.$("#part", box).value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); S.salvar(); }
    P.$("#form-part", box).addEventListener("submit", function (e) { e.preventDefault(); salvar(); P.toast("Participantes salvos"); refazer(); });
    P.$("#gerar-cert", box).addEventListener("click", function () {
      salvar();
      if (!c.participantes.length) { P.toast("Adicione ao menos um participante"); return; }
      location.hash = "#/certificado?c=" + c.id + "&m=" + P.$("#cert-mod", box).value;
    });
  }

  // ---------- Questionário de diagnóstico ----------
  P.views.diagnostico = function (main, cid) {
    var c = S.cliente(cid);
    if (!c) return P.views.naoEncontrado(main);
    var r = (c.diagnostico && c.diagnostico.respostas) || {}, pergs = P.perguntasDo(c.tipo);
    var porArea = {};
    pergs.forEach(function (p) { (porArea[p.area] = porArea[p.area] || []).push(p); });
    main.innerHTML =
      '<p class="migalha"><a href="#/clientes">Clientes</a> / <a href="#/cliente/' + c.id + '/1">' + esc(c.empresa) + "</a> / Diagnóstico</p>" +
      '<div class="topo"><div><h1>Diagnóstico: ' + esc(c.empresa) + "</h1><p>" + pergs.length + " perguntas para " + esc(C.tipos[c.tipo].nome.toLowerCase()) + ". Responda com o cliente, pensando nos últimos 3 meses.</p></div></div>" +
      '<form id="form-diag">' + Object.keys(porArea).map(function (area) {
        return '<section class="cartao"><h2>' + C.areas[area].nome + "</h2>" + porArea[area].map(function (p) {
          return '<div class="pergunta"><fieldset><legend>' + esc(p.texto) + (p.tipos ? ' <span class="area-tag">específica do setor</span>' : "") + '</legend><div class="opcoes">' +
            p.opcoes.map(function (o) { return '<label><input type="radio" name="' + p.id + '" value="' + o[1] + '"' + (r[p.id] === o[1] ? " checked" : "") + ">" + esc(o[0]) + "</label>"; }).join("") + "</div></fieldset></div>";
        }).join("") + "</section>";
      }).join("") +
      '<p class="muted" id="faltam" style="margin-top:14px" hidden></p><div class="acoes" style="margin-top:18px"><button class="btn btn-sinal" type="submit">Gerar relatório</button><a class="btn btn-linha" href="#/cliente/' + c.id + '/1">Cancelar</a></div></form>';
    P.$("#form-diag").addEventListener("submit", function (e) {
      e.preventDefault();
      var resp = {}, faltam = [];
      pergs.forEach(function (p) { var m = e.target.querySelector('input[name="' + p.id + '"]:checked'); if (m) resp[p.id] = +m.value; else faltam.push(p); });
      if (faltam.length) {
        var f = P.$("#faltam"); f.hidden = false; f.textContent = "Faltam " + faltam.length + " resposta(s). A primeira está destacada.";
        var alvo = e.target.querySelector('input[name="' + faltam[0].id + '"]'); alvo.focus(); alvo.closest(".pergunta").scrollIntoView({ block: "center" });
        return;
      }
      c.diagnostico = { data: P.hoje(), respostas: resp };
      if (c.etapas[1].status === "bloqueada") P.liberar(c, 1, false);
      S.salvar(); P.toast("Diagnóstico salvo"); location.hash = "#/cliente/" + c.id + "/relatorio";
    });
  };

  // ---------- Relatório ----------
  P.views.relatorio = function (main, cid) {
    var c = S.cliente(cid);
    if (!c || !c.diagnostico) return P.views.naoEncontrado(main);
    var p = P.pontuar(c), reg = P.regiao(c), t = C.tipos[c.tipo], K = C.consultor;
    var fracos = p.lista.filter(function (a) { return a.nota < 75; }).sort(function (a, b) { return a.nota - b.nota; });
    var fortes = p.lista.filter(function (a) { return a.nota >= 75; });
    var rec = P.recomendar(c).slice(0, 6), sug = P.planoSugerido(c);
    var leitura = p.geral < 40 ? "A operação depende muito de pessoas e de memória. Há ganho rápido em organizar o básico."
      : p.geral < 65 ? "A base existe, mas falta medir e padronizar. O próximo passo é transformar controles em indicadores."
        : "A operação está organizada. O ganho agora vem de automatizar e acompanhar indicadores todo mês.";
    function etapaDoServico(n) { for (var i = 0; i < C.etapas.length; i++) if (C.etapas[i].servicos.indexOf(n) !== -1) return C.etapas[i]; return C.etapas[0]; }
    main.innerHTML =
      '<div class="nao-imprimir"><p class="migalha"><a href="#/cliente/' + c.id + '/1">' + esc(c.empresa) + '</a> / Relatório</p><div class="acoes" style="margin-bottom:18px"><button class="btn btn-sinal" onclick="window.print()">Imprimir ou salvar PDF</button><a class="btn btn-linha" href="#/cliente/' + c.id + '/1">Voltar ao cliente</a></div></div>' +
      '<article class="doc"><div class="doc-cab"><div><small>Relatório de diagnóstico operacional</small><h1>' + esc(c.empresa) + "</h1><small>" + esc(t.nome) + " · " + esc((c.cidade || "") + (c.uf ? "/" + c.uf : "")) + "</small></div>" +
      '<div style="text-align:right"><small>Data</small><b>' + P.dataBR(c.diagnostico.data) + "</b><small style=\"margin-top:6px\">Preparado por</small><b>" + esc(K.nome) + "</b></div></div>" +
      '<div class="nota-geral"><b>' + p.geral + '</b><span class="muted">de 100 pontos</span></div><p style="margin-top:8px">' + leitura + "</p>" +
      "<h2>Nota por área</h2>" + G.barras(p.lista.map(function (a) { return { rotulo: a.nome, valor: a.nota, cor: P.corNota(a.nota) }; }), { max: 100, formato: function (v) { return v + " de 100"; }, titulo: "Nota por área" }) +
      '<p class="muted pequeno">Abaixo de 50: crítico. De 50 a 74: atenção. A partir de 75: bom.</p>' +
      "<h2>O que encontramos</h2>" + (fracos.length ? "<ol>" + fracos.map(function (a) { return "<li><b>" + a.nome + " (" + a.nota + ").</b> " + esc(C.achados[a.area][a.nota < 50 ? 0 : 1]) + "</li>"; }).join("") + "</ol>" : "<p>Nenhuma área abaixo de 75 pontos.</p>") +
      (fortes.length ? "<p>Pontos fortes: " + fortes.map(function (a) { return a.nome.toLowerCase(); }).join(", ") + ".</p>" : "") +
      '<p class="muted">No setor de ' + esc(t.nome.toLowerCase()) + ", a dor mais comum é: " + esc(t.dor.toLowerCase()) + ".</p>" +
      "<h2>Plano recomendado</h2><div class=\"tabela-wrap\"><table><thead><tr><th>Etapa</th><th>Serviço</th><th>Prazo</th><th class=\"num\">Investimento</th></tr></thead><tbody>" +
      rec.map(function (n) { var s = C.servicos[n], e = etapaDoServico(n); return "<tr><td>" + e.n + ". " + e.nome + "</td><td>" + esc(s.nome) + "</td><td>" + esc(s.prazo) + '</td><td class="num faixa">' + P.faixaServico(n, reg) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" +
      "<h2>Acompanhamento mensal sugerido</h2><p>Plano <b>" + C.planos[sug].nome + "</b>: " + esc(C.planos[sug].inclui) + ". Investimento de " + P.faixa(C.planos[sug].min, C.planos[sug].max, reg) + " por mês.</p>" +
      "<h2>Próximos passos</h2><ol><li>Validar este relatório e escolher as prioridades.</li><li>Começar pela etapa 2 (Organizar): procedimentos e planilhas da área com a menor nota.</li><li>Definir 3 indicadores e a data da reunião mensal.</li></ol>" +
      '<p class="muted pequeno" style="margin-top:28px;padding-top:14px;border-top:1px solid var(--fog)">' + esc(K.nome) + " · " + esc(K.titulo) + " · " + esc(K.email) + " · WhatsApp " + esc(K.whatsapp) + " · " + esc(K.site) + ". Faixas de investimento de referência para a região " + esc(C.regioes[reg].nome) + "; o valor final depende do escopo.</p></article>";
  };
})(window.P);
