/* =============================================================
 * GRÁFICOS em SVG, sem biblioteca externa.
 * Cada função devolve o texto de um <svg>.
 * ============================================================= */
window.Graf = (function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var fmt = {
    brl: function (v) { return "R$ " + Math.round(v).toLocaleString("pt-BR"); },
    mil: function (v) { return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " mil"; },
    pct: function (v) { return (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"; },
    num: function (v) { return Math.round(v).toLocaleString("pt-BR"); },
  };

  // Barras horizontais. itens: [{rotulo, valor, cor?, nota?}]
  function barras(itens, o) {
    o = o || {};
    var f = o.formato || fmt.num, larg = o.largura || 640, rot = o.rotulo || 170, alt = 34, topo = 8;
    var max = o.max || Math.max.apply(null, itens.map(function (i) { return i.valor; }).concat([1]));
    var h = topo + itens.length * alt + 4;
    var s = '<svg viewBox="0 0 ' + larg + " " + h + '" role="img" aria-label="' + esc(o.titulo || "Gráfico de barras") + '" class="graf">';
    itens.forEach(function (it, i) {
      var y = topo + i * alt, w = Math.max(2, (larg - rot - 110) * it.valor / max);
      s += '<text x="' + (rot - 12) + '" y="' + (y + 19) + '" text-anchor="end" class="g-rot">' + esc(it.rotulo) + "</text>";
      s += '<rect x="' + rot + '" y="' + (y + 6) + '" width="' + w + '" height="18" rx="4" fill="' + (it.cor || "var(--g-cinza)") + '"><title>' + esc(it.rotulo + ": " + f(it.valor)) + "</title></rect>";
      s += '<text x="' + (rot + w + 8) + '" y="' + (y + 19) + '" class="g-val">' + esc(f(it.valor)) + (it.nota ? ' <tspan class="g-nota">' + esc(it.nota) + "</tspan>" : "") + "</text>";
    });
    return s + "</svg>";
  }

  // Linha mensal. pontos: [{x, y}], marco: índice com linha tracejada e texto
  function linha(pontos, o) {
    o = o || {};
    var f = o.formato || fmt.num, larg = o.largura || 640, alt = o.altura || 240, esq = o.esq || 84, dir = 24, topo = 26, base = 34;
    var ys = pontos.map(function (p) { return p.y; });
    var max = o.max != null ? o.max : Math.max.apply(null, ys) * 1.12, min = o.min != null ? o.min : 0;
    var X = function (i) { return esq + i * (larg - esq - dir) / Math.max(1, pontos.length - 1); };
    var Y = function (v) { return topo + (alt - topo - base) * (1 - (v - min) / (max - min || 1)); };
    var s = '<svg viewBox="0 0 ' + larg + " " + alt + '" role="img" aria-label="' + esc(o.titulo || "Gráfico de linha") + '" class="graf">';
    for (var k = 0; k <= 3; k++) {
      var v = min + (max - min) * k / 3, y = Y(v);
      s += '<line x1="' + esq + '" x2="' + (larg - dir) + '" y1="' + y + '" y2="' + y + '" class="g-grade"/>';
      s += '<text x="' + (esq - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="g-eixo">' + esc(f(v)) + "</text>";
    }
    if (o.marco != null) {
      var xm = X(o.marco);
      s += '<line x1="' + xm + '" x2="' + xm + '" y1="' + (topo - 8) + '" y2="' + (alt - base) + '" class="g-marco"/>';
      s += '<text x="' + (xm + 6) + '" y="' + (topo + 2) + '" class="g-nota">' + esc(o.marcoTexto || "") + "</text>";
    }
    var d = pontos.map(function (p, i) { return (i ? "L" : "M") + X(i) + " " + Y(p.y); }).join("");
    s += '<path d="' + d + '" fill="none" stroke="' + (o.cor || "var(--g-destaque)") + '" stroke-width="2.5" stroke-linejoin="round"/>';
    pontos.forEach(function (p, i) {
      s += '<circle cx="' + X(i) + '" cy="' + Y(p.y) + '" r="3.5" fill="' + (o.cor || "var(--g-destaque)") + '"><title>' + esc(p.x + ": " + f(p.y)) + "</title></circle>";
      if (i % (o.passo || 1) === 0) s += '<text x="' + X(i) + '" y="' + (alt - 12) + '" text-anchor="middle" class="g-eixo">' + esc(p.x) + "</text>";
    });
    var ult = pontos[pontos.length - 1];
    s += '<text x="' + (X(pontos.length - 1) - 6) + '" y="' + (Y(ult.y) - 10) + '" text-anchor="end" class="g-val">' + esc(f(ult.y)) + "</text>";
    return s + "</svg>";
  }

  // Colunas agrupadas. grupos: [{x, valores:[a,b]}], series: [{nome, cor}]
  function colunas(grupos, series, o) {
    o = o || {};
    var f = o.formato || fmt.num, larg = o.largura || 640, alt = o.altura || 250, esq = o.esq || 84, dir = 12, topo = 34, base = 30;
    var todos = []; grupos.forEach(function (g) { todos = todos.concat(g.valores); });
    var max = Math.max.apply(null, todos.concat([1])) * 1.1;
    var bw = (larg - esq - dir) / grupos.length, cw = Math.min(22, (bw - 8) / series.length);
    var Y = function (v) { return topo + (alt - topo - base) * (1 - v / max); };
    var s = '<svg viewBox="0 0 ' + larg + " " + alt + '" role="img" aria-label="' + esc(o.titulo || "Gráfico de colunas") + '" class="graf">';
    for (var k = 0; k <= 3; k++) {
      var v = max * k / 3, y = Y(v);
      s += '<line x1="' + esq + '" x2="' + (larg - dir) + '" y1="' + y + '" y2="' + y + '" class="g-grade"/>';
      s += '<text x="' + (esq - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="g-eixo">' + esc(f(v)) + "</text>";
    }
    series.forEach(function (se, j) {
      s += '<rect x="' + (esq + j * 130) + '" y="6" width="12" height="12" rx="3" fill="' + se.cor + '"/><text x="' + (esq + j * 130 + 18) + '" y="16" class="g-rot">' + esc(se.nome) + "</text>";
    });
    grupos.forEach(function (g, i) {
      var x0 = esq + i * bw + (bw - cw * series.length) / 2;
      g.valores.forEach(function (v, j) {
        s += '<rect x="' + (x0 + j * cw) + '" y="' + Y(v) + '" width="' + (cw - 2) + '" height="' + (alt - base - Y(v)) + '" rx="3" fill="' + series[j].cor + '"><title>' + esc(g.x + ", " + series[j].nome + ": " + f(v)) + "</title></rect>";
      });
      if (i % (o.passo || 1) === 0) s += '<text x="' + (esq + i * bw + bw / 2) + '" y="' + (alt - 10) + '" text-anchor="middle" class="g-eixo">' + esc(g.x) + "</text>";
    });
    return s + "</svg>";
  }

  // Funil: etapas [{nome, n}]; cada barra proporcional ao maior valor
  function funil(etapas, o) {
    o = o || {};
    var larg = 480, alt = 52, h = etapas.length * alt + 8, rot = 130;
    var max = Math.max.apply(null, etapas.map(function (e) { return e.n; }).concat([1]));
    var s = '<svg viewBox="0 0 ' + larg + " " + h + '" role="img" aria-label="Funil de clientes por etapa" class="graf">';
    etapas.forEach(function (e, i) {
      var w = Math.max(4, (larg - rot - 44) * e.n / max), x = rot + (larg - rot - 44 - w) / 2, y = 4 + i * alt;
      s += '<text x="' + (rot - 12) + '" y="' + (y + 30) + '" text-anchor="end" class="g-rot">' + esc(e.nome) + "</text>";
      s += '<rect x="' + x + '" y="' + (y + 8) + '" width="' + w + '" height="34" rx="6" fill="var(--g-destaque)" fill-opacity="' + (0.35 + 0.65 * (i + 1) / etapas.length) + '"><title>' + esc(e.nome + ": " + e.n + " cliente(s)") + "</title></rect>";
      s += '<text x="' + (larg - 8) + '" y="' + (y + 30) + '" text-anchor="end" class="g-val">' + e.n + "</text>";
    });
    return s + "</svg>";
  }

  return { barras: barras, linha: linha, colunas: colunas, funil: funil, fmt: fmt, esc: esc };
})();
