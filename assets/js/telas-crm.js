/* =============================================================
 * TELAS DO CRM: início, funil, clientes, cadastro e acompanhamento.
 * ============================================================= */
(function (P) {
  "use strict";
  var C = window.CONTEUDO, S = window.Store, G = window.Graf, esc = P.esc;

  // ---------- Início ----------
  P.views.inicio = function (main) {
    var cs = S.get().clientes, avisos = P.todosAvisos();
    var ativos = cs.filter(function (c) { return P.etapaAtual(c) > 0; }).length;
    var mrr = cs.reduce(function (t, c) { return t + (c.plano && c.plano.tipo ? +c.plano.valor || 0 : 0); }, 0);
    var comPlano = cs.filter(function (c) { return c.plano && c.plano.tipo; }).length;
    var funil = [{ nome: "Contatos", n: cs.length }].concat(C.etapas.map(function (e) {
      return { nome: e.n + ". " + e.nome, n: cs.filter(function (c) { return P.etapaAtual(c) >= e.n; }).length };
    }));
    var recentes = cs.slice().sort(function (a, b) { return b.criadoEm < a.criadoEm ? -1 : 1; }).slice(0, 5);
    main.innerHTML =
      '<div class="topo"><div><h1>Início</h1><p>Como estão os clientes, o funil e o que pede atenção hoje.</p></div>' +
      '<div class="acoes"><a class="btn btn-sinal" href="#/clientes/novo">Novo cliente</a></div></div>' +
      '<div class="kpis">' +
      '<div class="kpi"><span>Clientes cadastrados</span><b>' + cs.length + "</b><small>" + ativos + " com etapa liberada</small></div>" +
      '<div class="kpi"><span>Receita mensal dos planos</span><b>' + G.fmt.brl(mrr) + "</b><small>" + comPlano + " cliente(s) com plano</small></div>" +
      '<div class="kpi"><span>Chegaram à etapa 5</span><b>' + funil[5].n + "</b><small>acompanhamento mensal</small></div>" +
      '<div class="kpi"><span>Avisos</span><b>' + avisos.length + "</b><small>" + avisos.filter(function (a) { return a.nivel === "alto"; }).length + " urgente(s)</small></div></div>" +
      '<div class="grade g2">' +
      '<section class="cartao"><h2>Funil de clientes</h2><p>Quantos clientes chegaram a cada etapa.</p>' + G.funil(funil) + "</section>" +
      '<section class="cartao"><h2>O que pede atenção</h2><p>Reuniões, etapas paradas e indicadores pendentes.</p><div style="margin-top:14px">' +
      P.htmlAvisos(avisos.slice(0, 6), "Tudo em dia.") + (avisos.length > 6 ? '<p style="margin-top:10px"><a href="#/acompanhamento">Ver todos os ' + avisos.length + " avisos</a></p>" : "") + "</div></section></div>" +
      '<section class="secao"><h2>Últimos cadastrados</h2>' + tabelaClientes(recentes) + "</section>";
    ligarTabela(main);
  };

  function tabelaClientes(lista) {
    if (!lista.length) return '<p class="vazio">Nenhum cliente ainda. <a href="#/clientes/novo">Cadastre o primeiro</a>.</p>';
    return '<div class="tabela-wrap"><table><thead><tr><th>Empresa</th><th>Tipo</th><th>Cidade</th><th>Etapa</th><th>Plano</th><th class="num">Avisos</th></tr></thead><tbody>' +
      lista.map(function (c) {
        var av = P.avisosDe(c).length;
        return '<tr class="clicavel" data-ir="#/cliente/' + c.id + '"><td><a href="#/cliente/' + c.id + '"><b>' + esc(c.empresa) + "</b></a><br><span class=\"muted pequeno\">" + esc(c.contato || "") + "</span></td>" +
          "<td>" + esc(C.tipos[c.tipo].nome) + "</td><td>" + esc((c.cidade || "") + (c.uf ? "/" + c.uf : "")) + "</td><td>" + P.etqEtapa(c) + "</td>" +
          "<td>" + (c.plano && c.plano.tipo ? esc(C.planos[c.plano.tipo].nome) + '<br><span class="muted pequeno">' + G.fmt.brl(c.plano.valor) + "/mês</span>" : '<span class="muted">Sem plano</span>') + "</td>" +
          '<td class="num">' + (av ? '<span class="etq etq-medio">' + av + "</span>" : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function ligarTabela(main) {
    P.$$("tr[data-ir]", main).forEach(function (tr) {
      tr.addEventListener("click", function (e) { if (!e.target.closest("a")) location.hash = tr.dataset.ir; });
    });
  }

  // ---------- Funil (quadro) ----------
  P.views.funil = function (main) {
    var cs = S.get().clientes;
    var cols = [{ n: 0, nome: "Novo contato" }].concat(C.etapas.map(function (e) { return { n: e.n, nome: e.n + ". " + e.nome }; }));
    main.innerHTML =
      '<div class="topo"><div><h1>Funil</h1><p>Arraste um cliente para a próxima coluna para liberar a etapa. As etapas anteriores em andamento são marcadas como concluídas.</p></div>' +
      '<div class="acoes"><a class="btn btn-sinal" href="#/clientes/novo">Novo cliente</a></div></div>' +
      '<div class="quadro">' + cols.map(function (col) {
        var lista = cs.filter(function (c) { return P.etapaAtual(c) === col.n; });
        return '<section class="coluna" data-coluna="' + col.n + '" aria-label="' + esc(col.nome) + '"><div class="coluna-topo"><h3>' + esc(col.nome) + "</h3><span>" + lista.length + "</span></div>" +
          lista.map(function (c) {
            var e = col.n ? c.etapas[col.n] : null;
            var sub = e ? (e.status === "concluida" ? "Concluída em " + P.dataBR(e.concluidaEm) : "Liberada há " + P.dias(e.liberadaEm, P.hoje()) + " dia(s)") : "Cadastrado em " + P.dataBR(c.criadoEm);
            return '<div class="ficha" draggable="true" data-id="' + c.id + '"><a href="#/cliente/' + c.id + (col.n ? "/" + col.n : "") + '"><b>' + esc(c.empresa) + "</b></a><span>" + esc(C.tipos[c.tipo].nome) + "</span><span>" + sub + "</span>" +
              (col.n < 6 ? '<button type="button" class="btn btn-linha btn-p ficha-avancar" data-id="' + c.id + '" data-n="' + (col.n + 1) + '">Liberar etapa ' + (col.n + 1) + "</button>" : "") + "</div>";
          }).join("") + "</section>";
      }).join("") + "</div>";

    P.$$(".ficha-avancar", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var c = S.cliente(b.dataset.id), n = +b.dataset.n;
        P.liberar(c, n, true); P.toast(c.empresa + ": etapa " + n + " liberada"); P.views.funil(main);
      });
    });
    var arrastando = null;
    P.$$(".ficha", main).forEach(function (f) {
      f.addEventListener("dragstart", function (e) { arrastando = f.dataset.id; e.dataTransfer.setData("text/plain", arrastando); e.dataTransfer.effectAllowed = "move"; });
    });
    P.$$(".coluna", main).forEach(function (col) {
      col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("alvo"); });
      col.addEventListener("dragleave", function () { col.classList.remove("alvo"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault(); col.classList.remove("alvo");
        var c = S.cliente(e.dataTransfer.getData("text/plain") || arrastando), n = +col.dataset.coluna;
        if (!c) return;
        var at = P.etapaAtual(c);
        if (n <= at) { P.toast("Para voltar uma etapa, abra o cliente."); return; }
        P.liberar(c, n, true);
        P.toast(c.empresa + ": etapa " + n + " liberada");
        P.views.funil(main);
      });
    });
  };

  // ---------- Lista de clientes ----------
  P.views.clientes = function (main) {
    var cs = S.get().clientes;
    main.innerHTML =
      '<div class="topo"><div><h1>Clientes</h1><p>' + cs.length + ' cadastrado(s). Clique num cliente para liberar etapas e entregar materiais.</p></div>' +
      '<div class="acoes"><a class="btn btn-sinal" href="#/clientes/novo">Novo cliente</a></div></div>' +
      '<div class="filtros"><div class="campo"><label for="busca">Buscar</label><input type="search" id="busca" placeholder="Empresa, contato ou cidade"></div>' +
      '<div class="campo"><label for="f-tipo">Tipo de empresa</label><select id="f-tipo"><option value="">Todos</option>' +
      Object.keys(C.tipos).map(function (k) { return '<option value="' + k + '">' + esc(C.tipos[k].nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="f-etapa">Etapa</label><select id="f-etapa"><option value="">Todas</option><option value="0">Novo contato</option>' +
      C.etapas.map(function (e) { return '<option value="' + e.n + '">' + e.n + ". " + e.nome + "</option>"; }).join("") + "</select></div></div>" +
      '<div id="lista"></div>';
    function filtrar() {
      var b = P.$("#busca").value.trim().toLowerCase(), t = P.$("#f-tipo").value, e = P.$("#f-etapa").value;
      var lista = cs.filter(function (c) {
        return (!b || (c.empresa + " " + c.contato + " " + c.cidade).toLowerCase().indexOf(b) !== -1) &&
          (!t || c.tipo === t) && (e === "" || P.etapaAtual(c) === +e);
      });
      P.$("#lista").innerHTML = tabelaClientes(lista);
      ligarTabela(main);
    }
    ["busca", "f-tipo", "f-etapa"].forEach(function (i) { P.$("#" + i).addEventListener("input", filtrar); });
    filtrar();
  };

  // ---------- Cadastro / edição ----------
  P.views.formCliente = function (main, cid) {
    var c = cid ? S.cliente(cid) : null;
    if (cid && !c) return P.views.naoEncontrado(main);
    var v = c || S.novoCliente({});
    var ufs = Object.keys(C.ufRegiao).sort();
    function campo(id, rot, tipo, extra) {
      return '<div class="campo' + (extra && extra.largo ? " largo" : "") + '"><label for="' + id + '">' + rot + '</label><input type="' + (tipo || "text") + '" id="' + id + '" name="' + id + '" value="' + esc(v[id] || "") + '"' + (extra && extra.req ? " required" : "") + "></div>";
    }
    main.innerHTML =
      '<p class="migalha"><a href="#/clientes">Clientes</a>' + (c ? ' / <a href="#/cliente/' + c.id + '">' + esc(c.empresa) + "</a>" : "") + "</p>" +
      '<div class="topo"><div><h1>' + (c ? "Editar cliente" : "Novo cliente") + "</h1><p>O tipo de empresa define as perguntas do diagnóstico e os serviços recomendados. A UF define a faixa de preço.</p></div></div>" +
      '<form class="cartao" id="form-cliente" novalidate><div class="campos">' +
      campo("empresa", "Empresa *", "text", { req: true }) + campo("contato", "Nome do contato") +
      campo("telefone", "WhatsApp", "tel") + campo("email", "E-mail", "email") +
      '<div class="campo"><label for="tipo">Tipo de empresa</label><select id="tipo" name="tipo">' +
      Object.keys(C.tipos).map(function (k) { return '<option value="' + k + '"' + (v.tipo === k ? " selected" : "") + ">" + esc(C.tipos[k].nome) + "</option>"; }).join("") + "</select></div>" +
      campo("cidade", "Cidade") +
      '<div class="campo"><label for="uf">UF</label><select id="uf" name="uf">' + ufs.map(function (u) { return '<option' + (v.uf === u ? " selected" : "") + ">" + u + "</option>"; }).join("") + "</select></div>" +
      campo("origem", "Como chegou (indicação, Instagram...)") +
      '</div><p class="muted pequeno" id="erro-form" style="margin-top:12px" hidden></p><div class="acoes" style="margin-top:20px"><button class="btn btn-sinal" type="submit">' + (c ? "Salvar alterações" : "Cadastrar cliente") + '</button><a class="btn btn-linha" href="' + (c ? "#/cliente/" + c.id : "#/clientes") + '">Cancelar</a></div></form>';
    P.$("#form-cliente").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, dados = {};
      ["empresa", "contato", "telefone", "email", "tipo", "cidade", "uf", "origem"].forEach(function (k) { dados[k] = f[k].value.trim(); });
      if (!dados.empresa) { var er = P.$("#erro-form"); er.hidden = false; er.textContent = "Preencha o nome da empresa."; f.empresa.focus(); return; }
      if (c) { Object.keys(dados).forEach(function (k) { c[k] = dados[k]; }); S.salvar(); P.toast("Cliente atualizado"); location.hash = "#/cliente/" + c.id; }
      else { var novo = S.adicionar(S.novoCliente(dados)); P.toast("Cliente cadastrado"); location.hash = "#/cliente/" + novo.id; }
    });
  };

  // ---------- Página do cliente ----------
  P.views.cliente = function (main, cid, etapaSel) {
    var c = S.cliente(cid);
    if (!c) return P.views.naoEncontrado(main);
    var sel = +etapaSel || P.etapaAtual(c) || 1, reg = P.regiao(c), tel = P.soDigitos(c.telefone);
    main.innerHTML =
      '<p class="migalha"><a href="#/clientes">Clientes</a> / ' + esc(c.empresa) + "</p>" +
      '<div class="cliente-cab"><div><h1>' + esc(c.empresa) + "</h1>" +
      '<div class="dados"><span>' + esc(C.tipos[c.tipo].nome) + "</span><span>" + esc((c.cidade || "") + (c.uf ? "/" + c.uf : "")) + " (" + C.regioes[reg].nome + ")</span>" +
      (c.contato ? "<span>" + esc(c.contato) + "</span>" : "") +
      (tel ? '<a href="https://wa.me/55' + tel + '" target="_blank" rel="noopener">WhatsApp ' + esc(c.telefone) + "</a>" : "") +
      (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : "") + "</div></div>" +
      '<div class="acoes"><a class="btn btn-linha btn-p" href="#/clientes/' + c.id + '/editar">Editar</a><button class="btn btn-perigo btn-p" type="button" id="excluir">Excluir</button></div></div>' +
      '<p class="muted" style="margin-top:12px">Dor comum do setor: ' + esc(C.tipos[c.tipo].dor) + ". Comece por: " + C.tipos[c.tipo].comece.map(function (n) { return n + " " + C.servicos[n].nome; }).join(", ") + ".</p>" +
      '<nav class="etapas" aria-label="Etapas do cliente">' + C.etapas.map(function (e) {
        var st = c.etapas[e.n].status;
        return '<a class="passo ' + st + (e.n === sel ? " atual" : "") + '" href="#/cliente/' + c.id + "/" + e.n + '"' + (e.n === sel ? ' aria-current="step"' : "") + '><span class="nro">Etapa ' + e.n + "</span><b>" + e.nome + '</b><span class="etq etq-' + st + '">' + P.statusTexto[st] + "</span></a>";
      }).join("") + "</nav>" +
      '<div id="painel-etapa"></div>' +
      '<section class="cartao secao"><h2>Anotações</h2><form id="form-nota" class="acoes" style="margin-top:12px"><input type="text" id="nota" placeholder="Ex.: ligou pedindo proposta do plano Gestão" aria-label="Nova anotação" style="flex:1;min-width:220px"><button class="btn btn-p" type="submit">Anotar</button></form>' +
      '<ul style="margin:14px 0 0;padding-left:20px;display:grid;gap:6px">' + c.anotacoes.slice().reverse().map(function (a) { return "<li><b>" + P.dataBR(a.data) + "</b> " + esc(a.texto) + "</li>"; }).join("") + "</ul></section>";

    P.$("#excluir").addEventListener("click", function () {
      if (confirm("Excluir " + c.empresa + " e todo o histórico? Isso não pode ser desfeito.")) { S.remover(c.id); P.toast("Cliente excluído"); location.hash = "#/clientes"; }
    });
    P.$("#form-nota").addEventListener("submit", function (e) {
      e.preventDefault(); var t = P.$("#nota").value.trim(); if (!t) return;
      c.anotacoes.push({ data: P.hoje(), texto: t }); S.salvar(); P.views.cliente(main, cid, sel);
    });
    P.etapaPainel(P.$("#painel-etapa"), c, sel, function () { P.views.cliente(main, cid, sel); });
  };

  // ---------- Acompanhamento ----------
  P.views.acompanhamento = function (main) {
    var cs = S.get().clientes, av = P.todosAvisos();
    var comPlano = cs.filter(function (c) { return c.plano && c.plano.tipo; });
    var h = P.hoje(), ym = h.slice(0, 7);
    main.innerHTML =
      '<div class="topo"><div><h1>Acompanhamento</h1><p>Avisos de todos os clientes e a agenda dos planos mensais (etapa 5).</p></div></div>' +
      '<section class="cartao"><h2>Avisos</h2><div style="margin-top:14px">' + P.htmlAvisos(av, "Nenhum aviso. Tudo em dia.") + "</div></section>" +
      '<section class="secao"><h2>Planos mensais</h2>' + (comPlano.length ?
        '<div class="tabela-wrap"><table><thead><tr><th>Cliente</th><th>Plano</th><th class="num">Valor</th><th>Reunião do mês</th><th>Última reunião</th><th>Indicadores</th></tr></thead><tbody>' +
        comPlano.map(function (c) {
          var feitas = c.reunioes.filter(function (r) { return r.feita; }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
          var feitaMes = feitas.some(function (r) { return r.data.slice(0, 7) === ym; });
          var ult = c.indicadores.map(function (x) { return x.mes; }).sort().pop();
          return '<tr class="clicavel" data-ir="#/cliente/' + c.id + '/5"><td><a href="#/cliente/' + c.id + '/5"><b>' + esc(c.empresa) + "</b></a></td><td>" + esc(C.planos[c.plano.tipo].nome) + '</td><td class="num">' + G.fmt.brl(c.plano.valor) + "</td>" +
            "<td>" + (feitaMes ? '<span class="etq etq-concluida">Feita</span>' : "Dia " + (c.plano.diaReuniao || 10)) + "</td><td>" + (feitas[0] ? P.dataBR(feitas[0].data) : "—") + "</td><td>" + (ult ? "até " + P.mesCurto(ult) : "nenhum") + "</td></tr>";
        }).join("") + '</tbody></table></div><p class="muted pequeno" style="margin-top:10px">Receita mensal: <b>' + G.fmt.brl(comPlano.reduce(function (t, c) { return t + (+c.plano.valor || 0); }, 0)) + "</b></p>"
        : '<p class="vazio">Nenhum cliente com plano. Defina o plano na etapa 5 de cada cliente.</p>') + "</section>";
    P.$$("tr[data-ir]", main).forEach(function (tr) { tr.addEventListener("click", function (e) { if (!e.target.closest("a")) location.hash = tr.dataset.ir; }); });
  };

  P.views.naoEncontrado = function (main) {
    main.innerHTML = '<div class="vazio"><h1>Página não encontrada</h1><p style="margin-top:8px">Esse cliente ou material não existe neste navegador. <a href="#/">Voltar ao início</a>.</p></div>';
  };
})(window.P);
