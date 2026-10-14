/* =============================================================
 * COFRE: pede a senha, abre o conteúdo criptografado e só então
 * carrega o painel. Os materiais também são abertos com a senha,
 * na hora do download. Sem a senha, os arquivos do site são
 * só dados embaralhados (AES-256-GCM, chave PBKDF2-SHA256).
 * ============================================================= */
(function () {
  "use strict";
  var SESSAO = "painel-consultoria.chave";
  var TELAS = ["assets/js/nucleo.js", "assets/js/telas-crm.js", "assets/js/telas-etapas.js", "assets/js/telas-materiais.js", "assets/js/app.js"];
  var TIPOS = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", zip: "application/zip", json: "application/json", md: "text/markdown;charset=utf-8", gs: "text/plain;charset=utf-8", html: "text/html;charset=utf-8", csv: "text/csv;charset=utf-8" };
  var chave = null;
  var subtle = window.crypto && window.crypto.subtle;

  function b64(buf) { var s = "", b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function deB64(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  function guardar(v) { try { v ? sessionStorage.setItem(SESSAO, v) : sessionStorage.removeItem(SESSAO); } catch (e) { /* navegador bloqueou: pede a senha de novo */ } }
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
  function carregarTelas(i) {
    if (i >= TELAS.length) return;
    var s = document.createElement("script"); s.src = TELAS[i];
    s.onload = function () { carregarTelas(i + 1); };
    document.body.appendChild(s);
  }
  function entrar() {
    return baixarBytes("cofre/conteudo.bin").then(abrir).then(function (claro) {
      var p = JSON.parse(new TextDecoder().decode(claro));
      window.CONTEUDO = p.conteudo; window.DADOS_EXEMPLO = p.dados;
      document.getElementById("acesso").hidden = true;
      document.querySelector(".app").hidden = false;
      carregarTelas(0);
    });
  }

  // Downloads dos materiais: troca o link pelo arquivo aberto com a chave
  function nomeCifrado(caminho) {
    return subtle.digest("SHA-256", new TextEncoder().encode(caminho)).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("").slice(0, 24) + ".bin";
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="materiais/"]');
    if (!a || !chave) return;
    e.preventDefault();
    var caminho = a.getAttribute("href"), nome = caminho.split("/").pop(), ext = nome.split(".").pop();
    nomeCifrado(caminho).then(function (n) { return baixarBytes("cofre/arquivos/" + n); }).then(abrir).then(function (claro) {
      var url = URL.createObjectURL(new Blob([claro], { type: TIPOS[ext] || "application/octet-stream" }));
      var l = document.createElement("a"); l.href = url; l.download = nome; document.body.appendChild(l); l.click(); l.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }).catch(function (err) { alert("Não foi possível baixar " + nome + ": " + err.message); });
  });

  // Sair
  window.sairDoPainel = function () { guardar(null); location.reload(); };

  // Tela de senha
  var form = document.getElementById("form-acesso"), erro = document.getElementById("erro-acesso"), botao = form.querySelector("button");
  if (!subtle) { erro.hidden = false; erro.textContent = "Este navegador não permite abrir o painel. Use o Chrome, o Edge ou o Firefox atualizados."; botao.disabled = true; return; }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var senha = document.getElementById("senha").value;
    if (!senha) return;
    erro.hidden = true; botao.disabled = true; botao.textContent = "Abrindo...";
    derivar(senha).then(function (k) { chave = k; return entrar(); }).then(function () {
      return subtle.exportKey("raw", chave).then(function (raw) { guardar(b64(raw)); });
    }).catch(function () {
      chave = null; erro.hidden = false; erro.textContent = "Senha incorreta. Confira e tente de novo.";
      botao.disabled = false; botao.textContent = "Entrar"; document.getElementById("senha").select();
    });
  });

  // Já entrou nesta aba? Reabre sem pedir a senha de novo.
  var salva = lida();
  if (salva) {
    subtle.importKey("raw", deB64(salva), { name: "AES-GCM" }, true, ["decrypt"]).then(function (k) { chave = k; return entrar(); })
      .catch(function () { chave = null; guardar(null); });
  }
})();
