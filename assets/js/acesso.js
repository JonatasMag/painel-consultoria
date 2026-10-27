/* =============================================================
 * ACESSO: entrada, cadastro, recuperação de senha e área do cliente.
 * Cliente cadastrado: vê e baixa as Ferramentas.
 * Administrador: abre o painel completo (CRM e materiais restritos).
 * ============================================================= */
(function () {
  "use strict";
  var CFG = window.PAINEL_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var VOLTA = location.origin + location.pathname;
  var perfil = null;

  function whats(texto) { return "https://wa.me/" + (CFG.whatsapp || "") + (texto ? "?text=" + encodeURIComponent(texto) : ""); }
  $$("[data-whats]").forEach(function (a) { a.href = whats("Olá, Jonatas! Vim pelo Meu Painel."); a.target = "_blank"; a.rel = "noopener"; });

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("ver");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("ver"); }, 2600);
  }

  // ---------- Lista de ferramentas na tela de entrada ----------
  $("#lista-ferramentas").innerHTML = (window.FERRAMENTAS || []).map(function (f) {
    return "<li><b>" + esc(f.nome) + "</b><span>" + esc(f.resumo) + "</span></li>";
  }).join("");

  // ---------- Formulários da entrada ----------
  var FORMS = ["f-entrar", "f-cadastro", "f-recuperar", "f-nova-senha", "f-cofre"];
  function mostrar(id) {
    if (!SB.configurado() && (id === "f-entrar" || id === "f-cadastro")) {
      FORMS.forEach(function (f) { $("#" + f).hidden = true; });
      $("#abas-acesso").hidden = true; $("#aviso-config").hidden = false;
      return;
    }
    FORMS.forEach(function (f) { $("#" + f).hidden = f !== id; });
    $("#msg-ok").hidden = true;
    var abas = id === "f-entrar" || id === "f-cadastro";
    $("#abas-acesso").hidden = !abas;
    $("#aba-entrar").setAttribute("aria-selected", String(id === "f-entrar"));
    $("#aba-cadastro").setAttribute("aria-selected", String(id === "f-cadastro"));
    var primeiro = $("#" + id + " input");
    if (primeiro && document.activeElement !== document.body) primeiro.focus();
  }
  function erro(form, msg) { var p = $(".acesso-erro", form); p.textContent = msg || ""; p.hidden = !msg; }
  function ocupado(form, sim, texto) {
    var b = $("button[type=submit]", form);
    if (sim) { b.dataset.t = b.textContent; b.textContent = texto || "Aguarde..."; } else if (b.dataset.t) b.textContent = b.dataset.t;
    b.disabled = sim;
  }
  function ok(html) { FORMS.forEach(function (f) { $("#" + f).hidden = true; }); $("#abas-acesso").hidden = true; var m = $("#msg-ok"); m.innerHTML = html; m.hidden = false; }

  $("#aba-entrar").addEventListener("click", function () { mostrar("f-entrar"); });
  $("#aba-cadastro").addEventListener("click", function () { mostrar("f-cadastro"); });
  $("#abas-acesso").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var alvo = $("#aba-entrar").getAttribute("aria-selected") === "true" ? "f-cadastro" : "f-entrar";
    mostrar(alvo); $(alvo === "f-entrar" ? "#aba-entrar" : "#aba-cadastro").focus();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ir]");
    if (b) { e.preventDefault(); mostrar(b.dataset.ir); }
  });
  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  $("#f-entrar").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, email = $("#e-email").value.trim(), senha = $("#e-senha").value;
    if (!emailValido(email) || !senha) return erro(f, "Digite seu e-mail e sua senha.");
    erro(f); ocupado(f, true, "Entrando...");
    SB.entrar(email, senha).then(function () { return depoisDeEntrar(true); })
      .catch(function (err) { erro(f, err.message); })
      .then(function () { ocupado(f, false); });
  });

  $("#f-cadastro").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var d = { nome: $("#c-nome").value.trim(), empresa: $("#c-empresa").value.trim(), telefone: $("#c-tel").value.trim(), email: $("#c-email").value.trim(), senha: $("#c-senha").value };
    if (d.nome.length < 2) return erro(f, "Digite seu nome.");
    if (d.empresa.length < 2) return erro(f, "Digite o nome da empresa.");
    if (!emailValido(d.email)) return erro(f, "Confira o e-mail digitado.");
    if (d.senha.length < 8) return erro(f, "A senha precisa ter pelo menos 8 caracteres.");
    if (!$("#c-aceite").checked) return erro(f, "Para criar a conta, marque a concordância com o uso dos dados.");
    erro(f); ocupado(f, true, "Criando a conta...");
    SB.cadastrar(d.email, d.senha, { origem: "painel", nome: d.nome, empresa: d.empresa, telefone: d.telefone, aceite: "sim" }, VOLTA)
      .then(function (r) {
        if (r.sessao) return depoisDeEntrar(true, true);
        ok("<h2>Falta só confirmar o e-mail</h2><p>Enviamos um link para <b>" + esc(d.email) + "</b>. Abra o e-mail, clique no link e você já entra no painel.</p><p class=\"muted pequeno\">Não chegou em 5 minutos? Veja a caixa de spam ou promoções.</p>");
      })
      .catch(function (err) { erro(f, err.message); })
      .then(function () { ocupado(f, false); });
  });

  $("#f-recuperar").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, email = $("#r-email").value.trim();
    if (!emailValido(email)) return erro(f, "Confira o e-mail digitado.");
    erro(f); ocupado(f, true, "Enviando...");
    SB.recuperar(email, VOLTA)
      .then(function () { ok("<h2>Link enviado</h2><p>Se <b>" + esc(email) + "</b> tiver cadastro, você vai receber um link para criar uma senha nova.</p><p><button type=\"button\" class=\"link\" data-ir=\"f-entrar\">Voltar para Entrar</button></p>"); })
      .catch(function (err) { erro(f, err.message); })
      .then(function () { ocupado(f, false); });
  });

  $("#f-nova-senha").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, nova = $("#n-senha").value;
    if (nova.length < 8) return erro(f, "A senha precisa ter pelo menos 8 caracteres.");
    erro(f); ocupado(f, true, "Salvando...");
    SB.trocarSenha(nova).then(function () { toast("Senha alterada"); return depoisDeEntrar(true); })
      .catch(function (err) { erro(f, err.message); })
      .then(function () { ocupado(f, false); });
  });

  $("#f-cofre").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, senha = $("#k-senha").value;
    if (!senha) return;
    if (!Cofre.disponivel) return erro(f, "Este navegador não permite abrir o painel. Use o Chrome, o Edge ou o Firefox atualizados.");
    erro(f); ocupado(f, true, "Abrindo...");
    Cofre.abrirComSenha(senha).catch(function () { erro(f, "Senha incorreta. Confira e tente de novo."); $("#k-senha").select(); })
      .then(function () { ocupado(f, false); });
  });

  // ---------- Depois do login: decide o que abrir ----------
  function carregarPerfil() {
    var u = SB.usuario();
    var id = u && u.id;
    var busca = id ? Promise.resolve(id) : SB.eu().then(function (x) { return x.id; });
    return busca.then(function (uid) { return SB.ler("painel_perfis", "select=*&id=eq." + encodeURIComponent(uid)); })
      .then(function (l) { return l && l[0] || null; });
  }

  function depoisDeEntrar(novoAcesso, cadastro) {
    return carregarPerfil().then(function (p) {
      if (!p) {
        SB.sair();
        mostrar("f-entrar");
        erro($("#f-entrar"), "Esta conta não tem cadastro no painel. Use a aba Criar conta grátis.");
        return;
      }
      perfil = p;
      if (novoAcesso || !sessaoJaContada()) {
        if (cadastro) Rastreio.registrar("cadastro", "");
        Rastreio.registrar("login", "");
        marcarSessao();
      }
      if (p.papel === "admin") return abrirAdmin();
      abrirCliente();
    });
  }
  function sessaoJaContada() { try { return sessionStorage.getItem("painel-consultoria.contado") === "1"; } catch (e) { return false; } }
  function marcarSessao() { try { sessionStorage.setItem("painel-consultoria.contado", "1"); } catch (e) { /* ok */ } }

  function abrirAdmin() {
    return Cofre.abrirSalvo().then(function (abriu) {
      if (abriu) return;
      return SB.ler("painel_cofre", "select=chave&id=eq.1").then(function (l) {
        if (l && l[0] && l[0].chave) return Cofre.abrirComChave(l[0].chave);
        throw new Error("sem chave");
      }).catch(function () {
        $("#acesso").hidden = false;
        mostrar("f-cofre");
        $("#f-cofre .muted").textContent = "Você entrou como administrador. Digite a senha do cofre para abrir o CRM e os materiais restritos.";
      });
    });
  }

  window.sairDoPainel = function () {
    Cofre.esquecer();
    if (window.SB) SB.sair();
    try { sessionStorage.removeItem("painel-consultoria.contado"); } catch (e) { /* ok */ }
    location.href = VOLTA;
  };

  // ---------- Área do cliente ----------
  var ICONE = {
    planilha: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    cadeado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  };
  function nomeArquivo(c) { return c.split("/").pop(); }

  var VIEWS = {
    ferramentas: function (m) {
      var F = window.FERRAMENTAS || [];
      m.innerHTML = '<div class="cli-cab"><p class="cli-sobre">Download livre</p><h1>Ferramentas de gestão</h1><p>' + F.length + " planilhas com as contas já montadas. Cada uma vem com o procedimento de implantação (POP) no padrão ABNT, em Word para editar com o nome da sua empresa e em PDF.</p></div>" +
        '<div class="cli-grade">' + F.map(function (f, i) {
          return '<article class="ferr"><div class="ferr-topo"><span class="ferr-n">' + String(i + 1).padStart(2, "0") + "</span><h2>" + esc(f.nome) + "</h2></div><p>" + esc(f.resumo) + "</p>" +
            '<ul class="ferr-lista">' + f.entrega.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
            '<div class="ferr-baixar">' +
            '<a class="baixar baixar-forte" href="' + f.planilha + '" download data-registro="Planilha: ' + esc(f.nome) + '">' + ICONE.planilha + "<span><b>Planilha</b><small>Excel (.xlsx)</small></span></a>" +
            '<a class="baixar" href="' + f.pop + '.docx" download data-registro="POP Word: ' + esc(f.nome) + '">' + ICONE.doc + "<span><b>" + f.codigo + "</b><small>Word (.docx)</small></span></a>" +
            '<a class="baixar" href="' + f.pop + '.pdf" download data-registro="POP PDF: ' + esc(f.nome) + '">' + ICONE.doc + "<span><b>" + f.codigo + "</b><small>PDF</small></span></a>" +
            "</div></article>";
        }).join("") +
        '<a class="ferr ferr-convite" href="#/empresa"><p class="cli-sobre">Para clientes da consultoria</p><h2>Quer esses controles funcionando na sua empresa?</h2><p>Na consultoria, os procedimentos e as planilhas saem com o nome da sua empresa, junto com diagnóstico, indicadores e acompanhamento mensal.</p><span class="btn btn-sinal">Ver o que está incluído</span></a>' +
        "</div>" +
        '<p class="cli-nota">Os dados das planilhas são exemplos. Troque pelos da sua empresa: as células em creme são as que você digita, e o resto se calcula sozinho.</p>';
    },
    empresa: function (m) {
      var X = window.EXCLUSIVO || [];
      var msg = "Olá, Jonatas! Sou " + (perfil && perfil.nome || "") + (perfil && perfil.empresa ? ", da " + perfil.empresa : "") + ". Vi o Meu Painel e quero saber como a consultoria funcionaria na minha empresa.";
      m.innerHTML = '<div class="cli-cab"><p class="cli-sobre">Para clientes da consultoria</p><h1>O que sua empresa recebe na consultoria</h1><p>Dentro do painel, cada cliente tem um espaço com o próprio nome e passa por seis etapas. Os materiais saem personalizados e na ordem das prioridades do diagnóstico.</p></div>' +
        '<ol class="cli-etapas">' + X.map(function (e) {
          return '<li><span class="etapa-n">' + e.n + '</span><div><h2>' + esc(e.nome) + "</h2><p>" + esc(e.texto) + '</p></div><span class="etapa-tranca" title="Exclusivo para clientes">' + ICONE.cadeado + "<small>Exclusivo</small></span></li>";
        }).join("") + "</ol>" +
        '<section class="cli-convite"><div><h2>Vamos conversar sobre a sua empresa?</h2><p>A primeira conversa é sem compromisso: entendo como a operação funciona hoje e indico por onde começar.</p></div>' +
        '<a class="btn btn-sinal" id="cta-empresa" target="_blank" rel="noopener" href="' + whats(msg) + '">Falar no WhatsApp</a></section>';
      $("#cta-empresa").addEventListener("click", function () { Rastreio.registrar("visita", "Contato pelo WhatsApp"); });
    },
    conta: function (m) {
      var p = perfil || {};
      m.innerHTML = '<div class="cli-cab"><h1>Minha conta</h1></div>' +
        '<section class="cartao"><h2>Seus dados</h2><dl class="cli-dados"><dt>Nome</dt><dd>' + esc(p.nome) + "</dd><dt>Empresa</dt><dd>" + esc(p.empresa) + "</dd><dt>E-mail</dt><dd>" + esc(p.email) + "</dd><dt>WhatsApp</dt><dd>" + (esc(p.telefone) || "Não informado") + '</dd></dl><p class="muted pequeno">Para corrigir algum dado, fale comigo pelo WhatsApp.</p></section>' +
        '<section class="cartao"><h2>Trocar senha</h2><form id="f-troca" class="cli-form" novalidate><div class="campo"><label for="t-senha">Senha nova</label><input type="password" id="t-senha" autocomplete="new-password" minlength="8"><small class="dica">Pelo menos 8 caracteres.</small></div><p class="acesso-erro" role="alert" hidden></p><button class="btn" type="submit">Salvar senha nova</button></form></section>' +
        '<section class="cartao"><h2>Privacidade</h2><p>Guardamos seus dados de cadastro e o registro de uso do painel: data e hora, cidade aproximada, tipo de aparelho e materiais acessados. O endereço IP não é guardado. Os dados não são vendidos nem compartilhados.</p>' +
        '<div class="acoes" style="margin-top:14px"><button class="btn btn-perigo" id="excluir-conta" type="button">Excluir minha conta</button></div></section>';
      $("#f-troca").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target, nova = $("#t-senha").value;
        if (nova.length < 8) return erro(f, "A senha precisa ter pelo menos 8 caracteres.");
        erro(f); ocupado(f, true, "Salvando...");
        SB.trocarSenha(nova).then(function () { $("#t-senha").value = ""; toast("Senha alterada"); }).catch(function (err) { erro(f, err.message); }).then(function () { ocupado(f, false); });
      });
      $("#excluir-conta").addEventListener("click", function () {
        if (!confirm("Excluir sua conta e todos os registros de uso? Esta ação não pode ser desfeita.")) return;
        SB.rpc("painel_excluir_conta").then(function () { alert("Conta excluída."); window.sairDoPainel(); })
          .catch(function (err) { alert("Não foi possível excluir: " + err.message); });
      });
    },
  };
  var TITULOS = { ferramentas: "Ferramentas", empresa: "Para sua empresa", conta: "Minha conta" };

  function rotaCliente() {
    var r = location.hash.replace(/^#\/?/, "").split("/")[0];
    if (!VIEWS[r]) r = "ferramentas";
    $$(".cli-menu a").forEach(function (a) { a.classList.toggle("ativo", a.dataset.rota === r); a.setAttribute("aria-current", a.dataset.rota === r ? "page" : "false"); });
    var m = $("#cliente-conteudo");
    VIEWS[r](m);
    document.title = TITULOS[r] + " | Meu Painel";
    window.scrollTo(0, 0);
    m.focus({ preventScroll: true });
    Rastreio.registrar("visita", TITULOS[r]);
  }

  function abrirCliente() {
    $("#acesso").hidden = true;
    $("#area-cliente").hidden = false;
    $("#cli-nome").textContent = (perfil.nome || "").split(" ")[0];
    $("[data-whats-cliente]").href = whats("Olá, Jonatas! Sou " + perfil.nome + (perfil.empresa ? ", da " + perfil.empresa : "") + ". Vi o Meu Painel e quero conversar sobre a minha empresa.");
    $("[data-whats-cliente]").addEventListener("click", function () { Rastreio.registrar("visita", "Contato pelo WhatsApp"); });
    $("#cli-sair").addEventListener("click", window.sairDoPainel);
    if (!/^#\/(ferramentas|empresa|conta)/.test(location.hash)) history.replaceState(null, "", "#/ferramentas");
    window.addEventListener("hashchange", rotaCliente);
    rotaCliente();
  }

  // Downloads livres: registra quem baixou o quê
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-registro]");
    if (a) Rastreio.registrar("download", a.dataset.registro || nomeArquivo(a.getAttribute("href")));
  });

  // ---------- Início ----------
  function iniciar() {
    var inicial = location.hash.replace(/^#\/?/, "");
    var ret = window.SB && SB.configurado() ? SB.lerRetorno() : null;

    if (!SB.configurado()) {
      $("#aviso-config").hidden = false;
      $("#f-entrar").hidden = true; $("#f-cadastro").hidden = true; $("#abas-acesso").hidden = true;
      return Cofre.abrirSalvo().then(function (abriu) { if (!abriu && inicial === "consultor") mostrar("f-cofre"); });
    }
    if (ret && ret.erro) {
      mostrar("f-entrar");
      erro($("#f-entrar"), /expired|invalid/i.test(ret.erro) ? "O link expirou ou já foi usado. Entre com sua senha ou peça um link novo em Esqueci minha senha." : ret.erro);
      return;
    }
    if (ret && ret.tipo === "recovery") { mostrar("f-nova-senha"); return; }
    if (SB.sessao()) {
      return depoisDeEntrar(!!ret, ret && ret.tipo === "signup").catch(function () {
        SB.sair(); mostrar("f-entrar");
      });
    }
    mostrar(inicial === "cadastro" ? "f-cadastro" : inicial === "consultor" ? "f-cofre" : "f-entrar");
  }
  iniciar();
})();
