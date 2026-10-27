/* =============================================================
 * ACESSOS (só administrador): quem se cadastrou, quando e de onde
 * acessa e o que mais usa. Também a lista de Ferramentas livres.
 * ============================================================= */
(function (P) {
  "use strict";
  var G = window.Graf, esc = P.esc, F = window.FERRAMENTAS || [];
  var PERIODOS = [[7, "7 dias"], [30, "30 dias"], [90, "90 dias"], [365, "12 meses"]];
  var periodo = 30;

  function dataHora(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function dia(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function lugar(e) {
    var p = [e.cidade, e.regiao].filter(Boolean).join(" – ");
    if (e.pais && e.pais !== "Brasil" && e.pais !== "Brazil") p += (p ? ", " : "") + e.pais;
    return p || "Não identificado";
  }
  function acao(e) {
    if (e.tipo === "login") return "Entrou no painel";
    if (e.tipo === "cadastro") return "Criou a conta";
    if (e.tipo === "download") return "Baixou " + e.recurso;
    return "Abriu " + e.recurso;
  }
  function contar(lista, chave) {
    var m = {};
    lista.forEach(function (x) { var k = chave(x); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { rotulo: k, valor: m[k] }; }).sort(function (a, b) { return b.valor - a.valor; });
  }
  function kpi(r, v, s) { return '<div class="kpi"><span>' + r + "</span><b>" + v + "</b>" + (s ? "<small>" + s + "</small>" : "") + "</div>"; }
  function whats(t) { var n = P.soDigitos(t); if (!n) return ""; if (n.length <= 11) n = "55" + n; return "https://wa.me/" + n; }

  function semBanco(main) {
    var configurado = window.SB && SB.configurado();
    main.innerHTML = '<div class="topo"><div><h1>Acessos ao Meu Painel</h1><p>Quem se cadastrou, quando e de onde acessa e o que mais usa.</p></div></div>' +
      '<section class="cartao"><h2>' + (configurado ? "Entre com sua conta de administrador" : "Falta ligar o banco de dados") + "</h2><p>" +
      (configurado ? "Você abriu o painel só com a senha do cofre. Para ver os acessos, saia e entre com o e-mail e a senha da sua conta de administrador."
        : "O cadastro de clientes e o registro de acessos usam o Supabase. Siga o passo a passo do arquivo supabase/LEIA-ME.md do repositório e cole a URL e a chave em assets/js/config.js.") +
      "</p>" + (configurado ? '<div class="acoes" style="margin-top:14px"><button class="btn" type="button" onclick="sairDoPainel()">Sair e entrar com e-mail</button></div>' : "") + "</section>";
  }

  function buscar(dias) {
    var desde = new Date(Date.now() - dias * 864e5).toISOString();
    return Promise.all([
      SB.ler("painel_perfis", "select=*&order=criado_em.desc&limit=5000"),
      SB.ler("painel_eventos", "select=*&criado_em=gte." + encodeURIComponent(desde) + "&order=criado_em.desc&limit=10000"),
    ]).then(function (r) {
      var perfis = r[0] || [], admins = {}, porId = {};
      perfis.forEach(function (p) { porId[p.id] = p; if (p.papel === "admin") admins[p.id] = 1; });
      var eventos = (r[1] || []).filter(function (e) { return !admins[e.usuario]; });
      eventos.forEach(function (e) { e.pessoa = porId[e.usuario] || { nome: "Conta excluída", empresa: "" }; });
      return { perfis: perfis.filter(function (p) { return p.papel !== "admin"; }), eventos: eventos, desde: desde };
    });
  }

  // ---------- Tela completa ----------
  P.views.acessos = function (main) {
    if (!window.SB || !SB.configurado() || !SB.sessao()) return semBanco(main);
    main.innerHTML = '<div class="topo"><div><h1>Acessos ao Meu Painel</h1><p>Quem se cadastrou, quando e de onde acessa e o que mais usa. A cidade é aproximada, pela conexão de internet.</p></div>' +
      '<div class="acoes" role="group" aria-label="Período">' + PERIODOS.map(function (p) {
        return '<button type="button" class="btn btn-p ' + (p[0] === periodo ? "" : "btn-linha") + '" data-periodo="' + p[0] + '" aria-pressed="' + (p[0] === periodo) + '">' + p[1] + "</button>";
      }).join("") + "</div></div><div id=\"acessos-corpo\"><p class=\"vazio\">Carregando os acessos...</p></div>";
    P.$$("[data-periodo]", main).forEach(function (b) {
      b.addEventListener("click", function () { periodo = +b.dataset.periodo; P.views.acessos(main); });
    });
    buscar(periodo).then(function (d) { desenhar(P.$("#acessos-corpo", main), d); })
      .catch(function (err) { P.$("#acessos-corpo", main).innerHTML = '<p class="vazio">Não foi possível carregar os acessos: ' + esc(err.message) + "</p>"; });
  };

  function desenhar(alvo, d) {
    var ev = d.eventos, perfis = d.perfis;
    var novos = perfis.filter(function (p) { return p.criado_em >= d.desde; });
    var logins = ev.filter(function (e) { return e.tipo === "login"; });
    var downs = ev.filter(function (e) { return e.tipo === "download"; });
    var visitas = ev.filter(function (e) { return e.tipo === "visita"; });
    var ativos = {}; ev.forEach(function (e) { ativos[e.usuario] = 1; });

    // Série por dia (ou por semana em períodos longos)
    var semanal = periodo > 60, grupos = [], hoje = new Date();
    var passo = semanal ? 7 : 1, n = Math.ceil(periodo / passo);
    for (var i = n - 1; i >= 0; i--) {
      var fim = new Date(hoje.getTime() - i * passo * 864e5), ini = new Date(fim.getTime() - (passo - 1) * 864e5);
      grupos.push({ de: dia(ini), ate: dia(fim), x: (semanal ? "" : "") + fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), valores: [0, 0] });
    }
    ev.forEach(function (e) {
      var k = dia(new Date(e.criado_em));
      for (var j = 0; j < grupos.length; j++) if (k >= grupos[j].de && k <= grupos[j].ate) {
        if (e.tipo === "login") grupos[j].valores[0]++;
        if (e.tipo === "download") grupos[j].valores[1]++;
        break;
      }
    });

    var downsPorPessoa = {}; downs.forEach(function (e) { downsPorPessoa[e.usuario] = (downsPorPessoa[e.usuario] || 0) + 1; });
    var nomePer = PERIODOS.filter(function (p) { return p[0] === periodo; })[0][1];

    alvo.innerHTML =
      '<div class="kpis">' +
      kpi("Pessoas cadastradas", perfis.length, novos.length + " nova(s) em " + nomePer) +
      kpi("Acessos", logins.length, "em " + nomePer) +
      kpi("Pessoas ativas", Object.keys(ativos).length, "usaram o painel em " + nomePer) +
      kpi("Downloads", downs.length, "em " + nomePer) + "</div>" +
      '<section class="cartao"><h2>Acessos e downloads ' + (semanal ? "por semana" : "por dia") + "</h2>" +
      (ev.length ? G.colunas(grupos, [{ nome: "Acessos", cor: "var(--g-destaque)" }, { nome: "Downloads", cor: "var(--signal)" }], { passo: Math.ceil(grupos.length / 10), esq: 48, largura: 900, titulo: "Acessos e downloads por período" }) : '<p class="vazio">Nenhum acesso neste período.</p>') + "</section>" +
      '<div class="grade g2 secao">' +
      '<section class="cartao"><h2>O que mais baixam</h2>' + (downs.length ? G.barras(contar(downs, function (e) { return e.recurso; }).slice(0, 10).map(function (x, i) { return { rotulo: x.rotulo, valor: x.valor, cor: i === 0 ? "var(--g-destaque)" : undefined }; }), { rotulo: 270, largura: 600, titulo: "Materiais mais baixados" }) : '<p class="vazio">Nenhum download neste período.</p>') + "</section>" +
      '<section class="cartao"><h2>Telas mais visitadas</h2>' + (visitas.length ? G.barras(contar(visitas, function (e) { return e.recurso; }).slice(0, 8), { rotulo: 190, largura: 560, titulo: "Telas mais visitadas" }) : '<p class="vazio">Nenhuma visita neste período.</p>') + "</section>" +
      '<section class="cartao"><h2>De onde acessam</h2>' + (logins.length ? G.barras(contar(logins, lugar).slice(0, 10), { rotulo: 230, largura: 560, titulo: "Acessos por cidade" }) : '<p class="vazio">Sem acessos neste período.</p>') + "</section>" +
      '<section class="cartao"><h2>Aparelho usado</h2>' + (logins.length ? G.barras(contar(logins, function (e) { return e.dispositivo || "Não identificado"; }), { rotulo: 190, largura: 560, titulo: "Acessos por aparelho" }) : '<p class="vazio">Sem acessos neste período.</p>') + "</section>" +
      "</div>" +
      '<section class="secao"><h2>Últimos acessos</h2>' + (ev.length ? '<div class="tabela-wrap"><table><thead><tr><th>Quando</th><th>Quem</th><th>O que fez</th><th>De onde</th><th>Aparelho</th></tr></thead><tbody>' +
        ev.slice(0, 200).map(function (e, i) {
          return "<tr" + (i >= 25 ? ' class="extra" hidden' : "") + "><td style=\"white-space:nowrap\">" + dataHora(e.criado_em) + "</td><td><b>" + esc(e.pessoa.nome) + "</b>" + (e.pessoa.empresa ? '<br><span class="muted pequeno">' + esc(e.pessoa.empresa) + "</span>" : "") + "</td><td>" + esc(acao(e)) + "</td><td>" + esc(lugar(e)) + "</td><td>" + esc(e.dispositivo || "") + "</td></tr>";
        }).join("") + "</tbody></table></div>" + (ev.length > 25 ? '<p style="margin-top:10px"><button type="button" class="btn btn-linha btn-p" id="ver-mais">Ver mais acessos</button></p>' : "") : '<p class="vazio">Nenhum acesso neste período.</p>') + "</section>" +
      '<section class="secao"><div class="topo" style="margin-bottom:14px"><div><h2>Pessoas cadastradas</h2><p>Contatos de quem baixou as Ferramentas. Use para oferecer uma conversa.</p></div>' +
      (perfis.length ? '<div class="acoes"><button type="button" class="btn btn-linha" id="baixar-cadastros">Baixar lista (CSV)</button></div>' : "") + "</div>" +
      (perfis.length ? '<div class="tabela-wrap"><table><thead><tr><th>Nome e empresa</th><th>Contato</th><th>Cadastro</th><th>Último acesso</th><th class="num">Downloads (' + nomePer + ")</th></tr></thead><tbody>" +
        perfis.map(function (p) {
          var w = whats(p.telefone);
          return "<tr><td><b>" + esc(p.nome) + "</b><br><span class=\"muted pequeno\">" + esc(p.empresa) + "</span></td><td>" + '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" +
            (w ? '<br><a href="' + w + '" target="_blank" rel="noopener">' + esc(p.telefone) + "</a>" : "") + "</td><td>" + (p.criado_em ? dataHora(p.criado_em) : "") + "</td><td>" + (p.ultimo_acesso ? dataHora(p.ultimo_acesso) : "Nunca") + '</td><td class="num">' + (downsPorPessoa[p.id] || 0) + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="vazio">Ninguém se cadastrou ainda. Divulgue o link do Meu Painel no portfólio e nas redes.</p>') + "</section>";

    var vm = P.$("#ver-mais", alvo);
    if (vm) vm.addEventListener("click", function () { P.$$("tr.extra", alvo).forEach(function (t) { t.hidden = false; }); vm.remove(); });
    var bt = P.$("#baixar-cadastros", alvo);
    if (bt) bt.addEventListener("click", function () {
      var linhas = [["Nome", "Empresa", "E-mail", "WhatsApp", "Cadastro", "Último acesso", "Downloads no período"]].concat(perfis.map(function (p) {
        return [p.nome, p.empresa, p.email, p.telefone, p.criado_em ? dataHora(p.criado_em) : "", p.ultimo_acesso ? dataHora(p.ultimo_acesso) : "", downsPorPessoa[p.id] || 0];
      }));
      var csv = "﻿" + linhas.map(function (l) { return l.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
      P.baixar("cadastros-meu-painel-" + P.hoje() + ".csv", csv, "text/csv;charset=utf-8");
    });
  }

  // ---------- Resumo no Início ----------
  var inicioOriginal = P.views.inicio;
  P.views.inicio = function (main) {
    inicioOriginal(main);
    var s = document.createElement("section");
    s.className = "cartao destaque-acessos";
    s.innerHTML = '<div class="topo" style="margin-bottom:12px"><div><h2>Meu Painel: últimos 7 dias</h2><p>Cadastros, acessos e downloads das Ferramentas gratuitas.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="#/acessos">Ver todos os acessos</a></div></div><div id="resumo-acessos"><p class="muted pequeno">Carregando...</p></div>';
    var kp = P.$(".kpis", main);
    kp.parentNode.insertBefore(s, kp.nextSibling);
    var alvo = P.$("#resumo-acessos", s);
    if (!window.SB || !SB.configurado() || !SB.sessao()) {
      alvo.innerHTML = '<p class="muted pequeno">' + (window.SB && SB.configurado() ? "Entre com sua conta de administrador (e-mail e senha) para ver os acessos." : "Ligue o banco de dados para começar a registrar cadastros e acessos.") + "</p>";
      return;
    }
    buscar(7).then(function (d) {
      var novos = d.perfis.filter(function (p) { return p.criado_em >= d.desde; }).length;
      var logins = d.eventos.filter(function (e) { return e.tipo === "login"; });
      var top = contar(d.eventos.filter(function (e) { return e.tipo === "download"; }), function (e) { return e.recurso; })[0];
      var ult = d.eventos[0];
      alvo.innerHTML = '<div class="mini-kpis">' +
        "<div><b>" + novos + "</b><span>novo(s) cadastro(s)</span></div>" +
        "<div><b>" + logins.length + "</b><span>acesso(s)</span></div>" +
        "<div><b>" + d.eventos.filter(function (e) { return e.tipo === "download"; }).length + "</b><span>download(s)</span></div>" +
        "<div><b>" + d.perfis.length + "</b><span>pessoas cadastradas no total</span></div></div>" +
        '<p class="pequeno" style="margin-top:12px">' + (top ? "Mais baixado: <b>" + esc(top.rotulo) + "</b> (" + top.valor + "). " : "") +
        (ult ? "Último acesso: <b>" + esc(ult.pessoa.nome) + "</b>" + (ult.pessoa.empresa ? ", " + esc(ult.pessoa.empresa) : "") + ", " + dataHora(ult.criado_em) + ", " + esc(lugar(ult)) + "." : "Nenhum acesso nos últimos 7 dias.") + "</p>";
    }).catch(function (err) { alvo.innerHTML = '<p class="muted pequeno">Não foi possível carregar: ' + esc(err.message) + "</p>"; });
  };

  // ---------- Ferramentas (visão do administrador) ----------
  P.views.ferramentas = function (main) {
    main.innerHTML = '<div class="topo"><div><h1>Ferramentas</h1><p>Material gratuito: qualquer pessoa cadastrada no Meu Painel baixa estes arquivos. Os outros materiais (aba Materiais) só você baixa.</p></div>' +
      '<div class="acoes"><a class="btn btn-linha" href="#/acessos">Ver quem baixou</a></div></div>' +
      F.map(function (f) {
        return '<section class="cartao"><h2>' + esc(f.nome) + "</h2><p>" + esc(f.resumo) + "</p>" +
          '<div class="material"><div><b>Planilha</b><p>' + esc(f.entrega.join(", ")) + '.</p></div><div class="acoes"><a class="btn btn-linha btn-p" href="' + f.planilha + '" download>Excel</a></div></div>' +
          '<div class="material"><div><b>' + f.codigo + " – procedimento de implantação</b><p>Padrão ABNT, Arial 12, no seu timbrado.</p></div><div class=\"acoes\"><a class=\"btn btn-linha btn-p\" href=\"" + f.pop + '.docx" download>Word</a><a class="btn btn-linha btn-p" href="' + f.pop + '.pdf" download>PDF</a></div></div></section>';
      }).join("");
  };
})(window.P);
