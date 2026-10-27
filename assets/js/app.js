/* =============================================================
 * ROTAS: cada endereço depois do # abre uma tela.
 * ============================================================= */
(function (P) {
  "use strict";
  var S = window.Store;
  S.carregar();
  var main = P.$("#conteudo");

  P.atualizarCasca = function () {
    var n = P.todosAvisos().length, cont = P.$("#contador-avisos");
    cont.hidden = !n; cont.textContent = n;
    P.$("#aviso-exemplo").hidden = !S.get().exemplo;
  };
  P.$("#comecar").addEventListener("click", function () {
    if (!confirm("Apagar os clientes de exemplo e começar com os seus? Os materiais continuam disponíveis.")) return;
    S.zerar(); P.atualizarCasca(); location.hash = "#/clientes/novo"; P.toast("Pronto. Cadastre o primeiro cliente.");
  });

  function rota() {
    var h = location.hash.replace(/^#\/?/, ""), partes = h.split("?"), cam = partes[0].split("/").filter(Boolean);
    var q = new URLSearchParams(partes[1] || ""), a = cam[0] || "", menu = a || "inicio";
    if (a === "cliente" || a === "pop" || a === "dashboard") menu = { cliente: "clientes", pop: "biblioteca", dashboard: "biblioteca" }[a];
    if (a === "modulo" || a === "certificado") menu = "biblioteca";
    P.$$(".menu a").forEach(function (l) { l.classList.toggle("ativo", l.dataset.rota === menu); });

    if (!a) P.views.inicio(main);
    else if (a === "funil") P.views.funil(main);
    else if (a === "clientes" && cam[1] === "novo") P.views.formCliente(main);
    else if (a === "clientes" && cam[2] === "editar") P.views.formCliente(main, cam[1]);
    else if (a === "clientes") P.views.clientes(main);
    else if (a === "cliente" && cam[2] === "diagnostico") P.views.diagnostico(main, cam[1]);
    else if (a === "cliente" && cam[2] === "relatorio") P.views.relatorio(main, cam[1]);
    else if (a === "cliente") P.views.cliente(main, cam[1], cam[2]);
    else if (a === "acompanhamento") P.views.acompanhamento(main);
    else if (a === "biblioteca") P.views.biblioteca(main, cam[1]);
    else if (a === "pop") P.views.pop(main, cam[1], q);
    else if (a === "modulo") P.views.modulo(main, cam[1], q);
    else if (a === "certificado") P.views.certificado(main, null, q);
    else if (a === "dashboard" && cam[1] === "completo") P.views.dashCompleto(main);
    else if (a === "dashboard") P.views.dashSimples(main);
    else if (a === "config") P.views.config(main);
    else if (a === "acessos") P.views.acessos(main);
    else if (a === "ferramentas") P.views.ferramentas(main);
    else P.views.naoEncontrado(main);

    P.atualizarCasca();
    var titulo = P.$("h1", main);
    document.title = (titulo ? titulo.textContent + " | " : "") + "Painel de Consultoria";
  }

  var ultimo = "";
  window.addEventListener("hashchange", function () {
    var base = location.hash.split("/").slice(0, 3).join("/");
    rota();
    if (base !== ultimo) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    ultimo = base;
  });
  rota();
})(window.P);
