/* =============================================================
 * NÚCLEO: funções usadas por todas as telas
 * (datas, preços por região, etapas, diagnóstico e avisos).
 * ============================================================= */
window.P = (function () {
  "use strict";
  var C = window.CONTEUDO, G = window.Graf, S = window.Store;
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  var P = { views: {}, esc: G.esc, fmt: G.fmt };

  P.$ = function (s, r) { return (r || document).querySelector(s); };
  P.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  P.hoje = S.hoje;
  P.mesCurto = function (ym) { return MESES[+ym.slice(5, 7) - 1] + "/" + ym.slice(2, 4); };
  P.mesLongo = function (ym) { return ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][+ym.slice(5, 7) - 1] + " de " + ym.slice(0, 4); };
  P.dataBR = function (iso) { return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : ""; };
  P.dias = function (de, ate) { return Math.round((new Date(ate + "T12:00:00") - new Date(de + "T12:00:00")) / 864e5); };
  P.mesAnterior = function (ym) { var a = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1; if (m === 0) { a--; m = 12; } return a + "-" + String(m).padStart(2, "0"); };
  P.soDigitos = function (t) { return String(t || "").replace(/\D/g, ""); };

  P.toast = function (msg) {
    var t = P.$("#toast"); t.textContent = msg; t.classList.add("ver");
    clearTimeout(P._t); P._t = setTimeout(function () { t.classList.remove("ver"); }, 2400);
  };

  // ---------- Preços ----------
  P.regiao = function (c) { return C.ufRegiao[c.uf] || "SCO"; };
  function arred(v) { var p = v < 300 ? 10 : v < 2000 ? 50 : 100; return Math.round(v / p) * p; }
  P.faixa = function (min, max, reg) {
    var f = C.regioes[reg].fator;
    return "R$ " + arred(min * f).toLocaleString("pt-BR") + " a " + arred(max * f).toLocaleString("pt-BR");
  };
  P.faixaServico = function (n, reg) {
    var s = C.servicos[n];
    return P.faixa(s.min, s.max, reg) + (s.unidade === "projeto" ? "" : " por " + s.unidade);
  };

  // ---------- Etapas ----------
  P.etapaAtual = function (c) { var a = 0; for (var i = 1; i <= 6; i++) if (c.etapas[i].status !== "bloqueada") a = i; return a; };
  P.statusTexto = { bloqueada: "Não liberada", liberada: "Em andamento", concluida: "Concluída" };
  P.liberar = function (c, n, concluirAnteriores) {
    if (concluirAnteriores) {
      for (var i = 1; i < n; i++) if (c.etapas[i].status === "liberada") { c.etapas[i].status = "concluida"; c.etapas[i].concluidaEm = P.hoje(); }
    }
    if (c.etapas[n].status === "bloqueada") { c.etapas[n].status = "liberada"; c.etapas[n].liberadaEm = P.hoje(); }
    S.salvar();
  };
  P.concluir = function (c, n) { c.etapas[n].status = "concluida"; c.etapas[n].concluidaEm = P.hoje(); S.salvar(); };
  P.reabrir = function (c, n) { c.etapas[n].status = "liberada"; c.etapas[n].concluidaEm = ""; S.salvar(); };
  P.bloquear = function (c, n) { c.etapas[n] = { status: "bloqueada", liberadaEm: "", concluidaEm: "" }; S.salvar(); };

  // ---------- Diagnóstico ----------
  P.perguntasDo = function (tipo) { return C.perguntas.filter(function (p) { return !p.tipos || p.tipos.indexOf(tipo) !== -1; }); };
  P.pontuar = function (c) {
    if (!c.diagnostico) return null;
    var r = c.diagnostico.respostas, soma = {};
    P.perguntasDo(c.tipo).forEach(function (p) {
      if (r[p.id] == null) return;
      var a = soma[p.area] || (soma[p.area] = { s: 0, m: 0 });
      a.s += r[p.id]; a.m += 3;
    });
    var lista = Object.keys(C.areas).filter(function (k) { return soma[k]; }).map(function (k) {
      return { area: k, nome: C.areas[k].nome, nota: Math.round(soma[k].s / soma[k].m * 100) };
    });
    var geral = lista.length ? Math.round(lista.reduce(function (t, a) { return t + a.nota; }, 0) / lista.length) : 0;
    return { lista: lista, geral: geral };
  };
  P.corNota = function (n) { return n < 50 ? "var(--critico)" : n < 75 ? "var(--alerta)" : "var(--ok)"; };
  P.recomendar = function (c) {
    var t = C.tipos[c.tipo], out = [];
    function add(n) { if (out.indexOf(n) === -1) out.push(n); }
    t.comece.forEach(add);
    var p = P.pontuar(c);
    if (p) p.lista.filter(function (a) { return a.nota < 75; }).sort(function (a, b) { return a.nota - b.nota; })
      .forEach(function (a) { C.areas[a.area].servicos.forEach(add); });
    t.depois.forEach(add);
    return out;
  };
  P.planoSugerido = function (c) {
    var p = P.pontuar(c);
    if (!p) return "painel";
    return p.geral < 40 ? "completo" : p.geral < 65 ? "gestao" : "painel";
  };

  // ---------- Avisos ----------
  P.avisosDe = function (c) {
    var h = P.hoje(), out = [], at = P.etapaAtual(c), link = "#/cliente/" + c.id;
    if (at === 0) {
      var d0 = P.dias(c.criadoEm, h);
      if (d0 > 7) out.push({ nivel: "medio", texto: "Novo contato há " + d0 + " dias sem etapa liberada", link: link });
    }
    if (c.etapas[1].status !== "bloqueada" && !c.diagnostico) out.push({ nivel: "alto", texto: "Diagnóstico liberado e ainda não preenchido", link: "#/cliente/" + c.id + "/diagnostico" });
    for (var i = 1; i <= 6; i++) {
      var e = c.etapas[i];
      if (e.status === "liberada" && i !== 5 && e.liberadaEm) {
        var d = P.dias(e.liberadaEm, h);
        if (d > 21) out.push({ nivel: "medio", texto: "Etapa " + i + " (" + C.etapas[i - 1].nome + ") aberta há " + d + " dias", link: link + "/" + i });
      }
    }
    if (c.plano && c.plano.tipo) {
      var ym = h.slice(0, 7), dia = +h.slice(8, 10), dr = +c.plano.diaReuniao || 10;
      var feita = c.reunioes.some(function (r) { return r.feita && r.data.slice(0, 7) === ym; });
      if (!feita) {
        if (dia > dr) out.push({ nivel: "alto", texto: "Reunião mensal atrasada (combinada para o dia " + dr + ")", link: link + "/5" });
        else if (dr - dia <= 5) out.push({ nivel: "medio", texto: dr === dia ? "Reunião mensal é hoje" : "Reunião mensal em " + (dr - dia) + " dia(s)", link: link + "/5" });
      }
      var ant = P.mesAnterior(ym);
      if (dia > 10 && c.plano.inicio && c.plano.inicio.slice(0, 7) <= ant && !c.indicadores.some(function (x) { return x.mes === ant; }))
        out.push({ nivel: "medio", texto: "Indicadores de " + P.mesCurto(ant) + " não lançados", link: link + "/5" });
      if (c.plano.inicio) {
        var dd = P.dias(c.plano.inicio, h), falta = 90 - (dd % 90);
        if (dd >= 60 && falta <= 10) out.push({ nivel: "medio", texto: "Revisão trimestral em " + falta + " dia(s)", link: link + "/5" });
      }
    }
    return out.map(function (a) { a.cliente = c; return a; });
  };
  P.todosAvisos = function () {
    var out = [];
    S.get().clientes.forEach(function (c) { out = out.concat(P.avisosDe(c)); });
    return out.sort(function (a, b) { return (a.nivel === "alto" ? 0 : 1) - (b.nivel === "alto" ? 0 : 1); });
  };
  P.htmlAvisos = function (lista, vazio) {
    if (!lista.length) return '<p class="vazio">' + (vazio || "Nenhum aviso agora.") + "</p>";
    return '<div class="avisos">' + lista.map(function (a) {
      return '<a class="aviso" href="' + a.link + '"><span class="etq etq-' + a.nivel + '">' + (a.nivel === "alto" ? "Urgente" : "Atenção") +
        "</span><span><b>" + P.esc(a.cliente.empresa) + "</b> " + P.esc(a.texto) + '</span><span class="muted">Abrir</span></a>';
    }).join("") + "</div>";
  };

  P.etqEtapa = function (c) {
    var at = P.etapaAtual(c);
    if (!at) return '<span class="etq">Novo contato</span>';
    var st = c.etapas[at].status;
    return '<span class="etq etq-' + st + '">' + at + ". " + C.etapas[at - 1].nome + (st === "concluida" ? " (concluída)" : "") + "</span>";
  };

  P.baixar = function (nome, texto, tipo) {
    var blob = new Blob([texto], { type: tipo || "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  return P;
})();
