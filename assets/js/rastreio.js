/* =============================================================
 * REGISTRO DE ACESSOS: quem, quando, de onde e o que usou.
 * A cidade é aproximada (pela conexão de internet) e o endereço IP
 * não é guardado. O aviso aparece no cadastro.
 * ============================================================= */
window.Rastreio = (function () {
  "use strict";
  var CHAVE = "painel-consultoria.local";
  var local = null;

  function dispositivo() {
    var ua = navigator.userAgent || "";
    var tipo = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Celular" : "Computador";
    var so = /Windows/i.test(ua) ? "Windows" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "";
    return so ? tipo + " (" + so + ")" : tipo;
  }

  function comTempo(url, ms) {
    var ctl = "AbortController" in window ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // Cidade aproximada, consultada uma vez por sessão
  function onde() {
    if (local) return Promise.resolve(local);
    try { var s = sessionStorage.getItem(CHAVE); if (s) return Promise.resolve(local = JSON.parse(s)); } catch (e) { /* segue sem cache */ }
    var fuso = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop().replace(/_/g, " ");
    return comTempo("https://get.geojs.io/v1/ip/geo.json", 3500)
      .then(function (d) { return { cidade: d.city || "", regiao: d.region || "", pais: d.country || "" }; })
      .catch(function () {
        return comTempo("https://ipapi.co/json/", 3500).then(function (d) { return { cidade: d.city || "", regiao: d.region || "", pais: d.country_name || "" }; });
      })
      .catch(function () { return { cidade: "", regiao: fuso ? "Fuso " + fuso : "", pais: "" }; })
      .then(function (l) {
        local = l;
        try { sessionStorage.setItem(CHAVE, JSON.stringify(l)); } catch (e) { /* ok */ }
        return l;
      });
  }

  function registrar(tipo, recurso) {
    if (!window.SB || !SB.configurado() || !SB.sessao()) return Promise.resolve();
    return onde().then(function (l) {
      return SB.rpc("painel_registrar", { p_tipo: tipo, p_recurso: recurso || "", p_cidade: l.cidade, p_regiao: l.regiao, p_pais: l.pais, p_dispositivo: dispositivo() });
    }).catch(function () { /* registrar nunca pode atrapalhar quem está usando */ });
  }

  return { registrar: registrar, dispositivo: dispositivo, onde: onde };
})();
