/* =============================================================
 * COFRE: abre o conteúdo criptografado do consultor (CRM, POPs,
 * planilhas, dashboards, automações e treinamentos).
 * A chave vem do banco (só para o administrador logado) ou da
 * senha do cofre. Sem ela, os arquivos são dados embaralhados
 * (AES-256-GCM, chave PBKDF2-SHA256).
 * ============================================================= */
window.Cofre = (function () {
  "use strict";
  var SESSAO = "painel-consultoria.chave";
  var TELAS = ["assets/js/nucleo.js", "assets/js/telas-crm.js", "assets/js/telas-etapas.js", "assets/js/telas-materiais.js", "assets/js/telas-acessos.js", "assets/js/app.js"];
  var TIPOS = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdf: "application/pdf", zip: "application/zip", json: "application/json",
    md: "text/markdown;charset=utf-8", gs: "text/plain;charset=utf-8", html: "text/html;charset=utf-8", csv: "text/csv;charset=utf-8",
  };
  var chave = null, aberto = false;
  var subtle = window.crypto && window.crypto.subtle;

  function b64(buf) { var s = "", b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function deB64(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  function guardar(v) { try { v ? sessionStorage.setItem(SESSAO, v) : sessionStorage.removeItem(SESSAO); } catch (e) { /* navegador bloqueou: pede de novo */ } }
  function lida() { try { return sessionStorage.getItem(SESSAO); } catch (e) { return null; } }

  function baixarBytes(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("Arquivo não encontrado (" + r.status + ")"); return r.arrayBuffer(); });
  }
  function abrir(buf) {
    var b = new Uint8Array(buf);
    return subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, chave, b.slice(12));
  }
  function derivar(senha) {
    return fetch("cofre/sal.txt", { cache: "no-cache" }).then(function (r) { return r.text(); }).then(function (t) {
      var l = t.trim().split("\n");
      return subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveKey"]).then(function (base) {
        return subtle.deriveKey({ name: "PBKDF2", salt: deB64(l[0]), iterations: +l[1], hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
      });
    });
  }
  function importar(rawB64) { return subtle.importKey("raw", deB64(rawB64), { name: "AES-GCM" }, true, ["decrypt"]); }
  function carregarTelas(i) {
    if (i >= TELAS.length) return;
    var s = document.createElement("script"); s.src = TELAS[i];
    s.onload = function () { carregarTelas(i + 1); };
    document.body.appendChild(s);
  }
  // Abre o conteúdo e mostra o painel do consultor
  function entrar(k) {
    chave = k;
    return baixarBytes("cofre/conteudo.bin").then(abrir).then(function (claro) {
      var p = JSON.parse(new TextDecoder().decode(claro));
      window.CONTEUDO = p.conteudo; window.DADOS_EXEMPLO = p.dados;
      return subtle.exportKey("raw", chave).then(function (raw) { guardar(b64(raw)); });
    }).then(function () {
      if (aberto) return;
      aberto = true;
      document.getElementById("acesso").hidden = true;
      document.getElementById("area-cliente").hidden = true;
      document.querySelector(".app").hidden = false;
      carregarTelas(0);
    }).catch(function (e) { chave = null; throw e; });
  }

  // Downloads dos materiais: troca o link pelo arquivo aberto com a chave
  function nomeCifrado(caminho) {
    return subtle.digest("SHA-256", new TextEncoder().encode(caminho)).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("").slice(0, 24) + ".bin";
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="materiais/"]');
    if (!a) return;
    e.preventDefault();
    if (!chave) { alert("Este material é exclusivo dos clientes da consultoria."); return; }
    var caminho = a.getAttribute("href"), nome = caminho.split("/").pop(), ext = nome.split(".").pop();
    nomeCifrado(caminho).then(function (n) { return baixarBytes("cofre/arquivos/" + n); }).then(abrir).then(function (claro) {
      var url = URL.createObjectURL(new Blob([claro], { type: TIPOS[ext] || "application/octet-stream" }));
      var l = document.createElement("a"); l.href = url; l.download = nome; document.body.appendChild(l); l.click(); l.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }).catch(function (err) { alert("Não foi possível baixar " + nome + ": " + err.message); });
  });

  return {
    disponivel: !!subtle,
    abrirComSenha: function (senha) { return derivar(senha).then(entrar); },
    abrirComChave: function (rawB64) { return importar(rawB64).then(entrar); },
    abrirSalvo: function () {
      var s = lida();
      if (!s || !subtle) return Promise.resolve(false);
      return importar(s).then(entrar).then(function () { return true; }).catch(function () { guardar(null); return false; });
    },
    esquecer: function () { guardar(null); chave = null; },
  };
})();
