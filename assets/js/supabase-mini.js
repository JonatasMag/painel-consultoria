/* =============================================================
 * SUPABASE (versão mínima, sem biblioteca externa)
 * Login, cadastro, recuperação de senha e acesso às tabelas
 * pela API pública do Supabase. A sessão fica no navegador.
 * ============================================================= */
window.SB = (function () {
  "use strict";
  var CFG = window.PAINEL_CONFIG || {};
  var URL_BASE = String(CFG.supabaseUrl || "").replace(/\/+$/, "");
  var CHAVE = CFG.supabaseAnonKey || "";
  var GUARDA = "painel-consultoria.sessao";
  var sessao = null;

  function ler() { try { return JSON.parse(localStorage.getItem(GUARDA) || "null"); } catch (e) { return null; } }
  function gravar(s) {
    sessao = s;
    try { s ? localStorage.setItem(GUARDA, JSON.stringify(s)) : localStorage.removeItem(GUARDA); } catch (e) { /* navegador bloqueou: a sessão vale só nesta aba */ }
  }
  sessao = ler();

  var MENSAGENS = [
    [/invalid login credentials/i, "E-mail ou senha incorretos."],
    [/email not confirmed/i, "Confirme seu e-mail pelo link que enviamos antes de entrar."],
    [/already registered|already been registered|user already exists/i, "Este e-mail já tem cadastro. Use a aba Entrar."],
    [/password should be at least|weak password/i, "A senha precisa ter pelo menos 8 caracteres."],
    [/rate limit|too many requests|security purposes/i, "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."],
    [/unable to validate email|invalid email|email address .* is invalid/i, "Confira o e-mail digitado."],
    [/signups not allowed|signup is disabled/i, "Os cadastros estão fechados no momento."],
    [/failed to fetch|networkerror|load failed/i, "Sem conexão com o servidor. Confira a internet e tente de novo."],
  ];
  function traduzir(msg) {
    for (var i = 0; i < MENSAGENS.length; i++) if (MENSAGENS[i][0].test(msg)) return MENSAGENS[i][1];
    return msg || "Não foi possível concluir. Tente de novo.";
  }

  function pedir(caminho, opcoes, token) {
    opcoes = opcoes || {};
    var cab = { apikey: CHAVE, "Content-Type": "application/json" };
    cab.Authorization = "Bearer " + (token || CHAVE);
    Object.keys(opcoes.headers || {}).forEach(function (k) { cab[k] = opcoes.headers[k]; });
    return fetch(URL_BASE + caminho, { method: opcoes.method || "GET", headers: cab, body: opcoes.body ? JSON.stringify(opcoes.body) : undefined })
      .catch(function (e) { throw new Error(traduzir(e.message)); })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = null;
          try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
          if (!r.ok) {
            var m = d && (d.error_description || d.msg || d.message || d.error) || ("Erro " + r.status);
            var err = new Error(traduzir(String(m)));
            err.status = r.status;
            throw err;
          }
          return d;
        });
      });
  }

  function guardarSessao(d) {
    if (!d || !d.access_token) return null;
    var s = { access_token: d.access_token, refresh_token: d.refresh_token, expira: Date.now() + (Number(d.expires_in) || 3600) * 1000, user: d.user || (sessao && sessao.user) || null };
    gravar(s);
    return s;
  }

  // Token válido (renova se faltar menos de 1 minuto)
  function token() {
    if (!sessao) return Promise.reject(new Error("Sessão encerrada. Entre de novo."));
    if (sessao.expira - Date.now() > 60000) return Promise.resolve(sessao.access_token);
    return pedir("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sessao.refresh_token } })
      .then(function (d) { return guardarSessao(d).access_token; })
      .catch(function (e) { gravar(null); throw e; });
  }

  function comToken(fn) {
    return token().then(fn).catch(function (e) {
      if (e.status !== 401 || !sessao) throw e;
      sessao.expira = 0; // força renovar uma vez
      return token().then(fn);
    });
  }

  return {
    configurado: function () { return !!(URL_BASE && CHAVE); },
    sessao: function () { return sessao; },
    usuario: function () { return sessao && sessao.user; },
    traduzir: traduzir,

    entrar: function (email, senha) {
      return pedir("/auth/v1/token?grant_type=password", { method: "POST", body: { email: email, password: senha } }).then(guardarSessao);
    },
    cadastrar: function (email, senha, dados, voltarPara) {
      return pedir("/auth/v1/signup?redirect_to=" + encodeURIComponent(voltarPara), { method: "POST", body: { email: email, password: senha, data: dados } })
        .then(function (d) { return { sessao: guardarSessao(d), usuario: d && (d.user || d) }; });
    },
    recuperar: function (email, voltarPara) {
      return pedir("/auth/v1/recover?redirect_to=" + encodeURIComponent(voltarPara), { method: "POST", body: { email: email } });
    },
    trocarSenha: function (nova) {
      return comToken(function (t) { return pedir("/auth/v1/user", { method: "PUT", body: { password: nova } }, t); });
    },
    sair: function () {
      var s = sessao;
      gravar(null);
      if (s) pedir("/auth/v1/logout", { method: "POST" }, s.access_token).catch(function () { /* a sessão local já foi apagada */ });
    },

    // Volta do link do e-mail (#access_token=...&type=signup|recovery)
    lerRetorno: function () {
      var h = location.hash.replace(/^#/, "");
      if (!/(^|&)(access_token|error_description)=/.test(h)) return null;
      var q = new URLSearchParams(h);
      history.replaceState(null, "", location.pathname + location.search);
      if (q.get("error_description")) return { erro: q.get("error_description").replace(/\+/g, " ") };
      var s = guardarSessao({ access_token: q.get("access_token"), refresh_token: q.get("refresh_token"), expires_in: q.get("expires_in") });
      return { tipo: q.get("type") || "", sessao: s };
    },

    // Tabelas e funções (REST)
    ler: function (tabela, consulta) {
      return comToken(function (t) { return pedir("/rest/v1/" + tabela + "?" + consulta, {}, t); });
    },
    rpc: function (funcao, args) {
      return comToken(function (t) { return pedir("/rest/v1/rpc/" + funcao, { method: "POST", body: args || {} }, t); });
    },
    eu: function () {
      return comToken(function (t) {
        return pedir("/auth/v1/user", {}, t).then(function (u) { if (sessao) { sessao.user = u; gravar(sessao); } return u; });
      });
    },
  };
})();
