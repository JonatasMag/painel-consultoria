/* =============================================================
 * ARMAZENAMENTO: os dados ficam só neste navegador (localStorage).
 * Use Configurações > Baixar backup para guardar uma cópia.
 * ============================================================= */
window.Store = (function () {
  var CHAVE = "painel-consultoria.v1";
  var memoria = null; // usado se o navegador bloquear o armazenamento
  var estado = null;

  function hojeISO() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function somaDias(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function id() { return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function etapasVazias() {
    var e = {};
    for (var i = 1; i <= 6; i++) e[i] = { status: "bloqueada", liberadaEm: "", concluidaEm: "" };
    return e;
  }

  function novoCliente(campos) {
    var c = {
      id: id(), empresa: "", contato: "", telefone: "", email: "", tipo: "varejo", cidade: "", uf: "SC",
      origem: "", criadoEm: hojeISO(), etapas: etapasVazias(), diagnostico: null,
      plano: { tipo: "", valor: 0, inicio: "", diaReuniao: 10 }, reunioes: [], indicadores: [],
      entregas: {}, anotacoes: [], participantes: [],
    };
    for (var k in campos) c[k] = campos[k];
    return c;
  }

  function ler() {
    try {
      var txt = window.localStorage.getItem(CHAVE);
      return txt ? JSON.parse(txt) : null;
    } catch (e) { return memoria; }
  }
  function gravar() {
    estado.atualizadoEm = new Date().toISOString();
    try { window.localStorage.setItem(CHAVE, JSON.stringify(estado)); }
    catch (e) { memoria = JSON.parse(JSON.stringify(estado)); }
  }

  function exemplo() {
    var h = hojeISO();
    var lib = function (dias) { return somaDias(h, -dias); };
    function etapasAte(n, concluidasAte, dias) {
      var e = etapasVazias();
      for (var i = 1; i <= n; i++) {
        e[i].status = i <= concluidasAte ? "concluida" : "liberada";
        e[i].liberadaEm = lib(dias - (i - 1) * 12);
        if (i <= concluidasAte) e[i].concluidaEm = lib(dias - (i - 1) * 12 - 10);
      }
      return e;
    }
    var mesAnt = somaDias(h, -30).slice(0, 7), mes2 = somaDias(h, -60).slice(0, 7), mes3 = somaDias(h, -90).slice(0, 7);
    var clientes = [
      novoCliente({ empresa: "Mercado Exemplo", contato: "Marta Souza", telefone: "(47) 90000-0001", email: "marta@exemplo.com", tipo: "varejo", cidade: "Joinville", uf: "SC", origem: "Indicação", criadoEm: lib(170),
        etapas: etapasAte(5, 4, 160), plano: { tipo: "gestao", valor: 2400, inicio: lib(70), diaReuniao: 10 },
        diagnostico: { data: lib(155), respostas: { e1: 0, e2: 1, e3: 0, e4: 1, v1: 1, v2: 1, v3: 0, p1: 0, p2: 1, p3: 1, f1: 1, f2: 1, f3: 0, d1: 1, d2: 0, a1: 1, a2: 1 } },
        reunioes: [{ data: lib(62), feita: true, nota: "Primeira reunião: ruptura caiu de 12% para 10%." }, { data: lib(32), feita: true, nota: "Ruptura 8,5%. Ajustado ponto de pedido de bebidas." }],
        indicadores: [{ mes: mes3, nome: "Ruptura (%)", valor: 10.1 }, { mes: mes2, nome: "Ruptura (%)", valor: 8.5 }, { mes: mesAnt, nome: "Ruptura (%)", valor: 6.0 },
          { mes: mes3, nome: "Faturamento (R$ mil)", valor: 163 }, { mes: mes2, nome: "Faturamento (R$ mil)", valor: 174 }, { mes: mesAnt, nome: "Faturamento (R$ mil)", valor: 183 }],
        participantes: ["Marta Souza", "Ana Lima", "Bruno Reis"] }),
      novoCliente({ empresa: "Distribuidora Modelo", contato: "Carlos Pereira", telefone: "(47) 90000-0002", email: "carlos@exemplo.com", tipo: "distribuidora", cidade: "Jaraguá do Sul", uf: "SC", origem: "LinkedIn", criadoEm: lib(80),
        etapas: etapasAte(3, 2, 75), diagnostico: { data: lib(72), respostas: { e1: 1, e2: 0, e3: 1, e4: 0, v1: 2, v2: 0, v3: 1, p1: 1, p2: 1, p3: 0, f1: 2, f2: 1, f3: 1, d1: 1, d2: 1, a1: 2, a2: 1, x7: 0 } } }),
      novoCliente({ empresa: "Clínica Bem-Estar", contato: "Dra. Paula Nunes", telefone: "(41) 90000-0003", email: "paula@exemplo.com", tipo: "clinica", cidade: "Curitiba", uf: "PR", origem: "Instagram", criadoEm: lib(40),
        etapas: etapasAte(2, 1, 35), diagnostico: { data: lib(33), respostas: { e1: 2, e2: 2, e3: 2, v1: 1, v2: 1, v3: 1, p1: 1, p2: 0, p3: 1, f1: 1, f2: 1, f3: 1, d1: 1, d2: 0, a1: 0, a2: 0, x3: 1 } } }),
      novoCliente({ empresa: "Restaurante Sabor da Casa", contato: "João Martins", telefone: "(92) 90000-0004", email: "joao@exemplo.com", tipo: "restaurante", cidade: "Manaus", uf: "AM", origem: "Indicação", criadoEm: lib(25),
        etapas: etapasAte(1, 0, 22) }),
      novoCliente({ empresa: "Imobiliária Horizonte", contato: "Renata Alves", telefone: "(11) 90000-0005", email: "renata@exemplo.com", tipo: "imobiliaria", cidade: "São Paulo", uf: "SP", origem: "Site", criadoEm: lib(130),
        etapas: etapasAte(6, 5, 125), plano: { tipo: "painel", valor: 1100, inicio: lib(45), diaReuniao: 5 },
        diagnostico: { data: lib(120), respostas: { e1: 2, e2: 2, e3: 2, v1: 1, v2: 1, v3: 0, p1: 1, p2: 1, p3: 1, f1: 2, f2: 2, f3: 2, d1: 1, d2: 1, a1: 0, a2: 1, x3: 1, x5: 0 } },
        reunioes: [{ data: lib(40), feita: true, nota: "Leads do site: 48 no mês, 9 visitas." }], participantes: ["Renata Alves", "Lucas Prado"] }),
      novoCliente({ empresa: "Associação Mãos Unidas", contato: "Pr. Samuel Rocha", telefone: "(47) 90000-0006", email: "samuel@exemplo.com", tipo: "ong", cidade: "Joinville", uf: "SC", origem: "Igreja", criadoEm: lib(6) }),
    ];
    return { versao: 1, exemplo: true, clientes: clientes };
  }

  function carregar() {
    estado = ler();
    if (!estado) { estado = exemplo(); gravar(); }
    return estado;
  }

  return {
    carregar: carregar,
    get: function () { return estado; },
    salvar: gravar,
    hoje: hojeISO,
    somaDias: somaDias,
    novoCliente: novoCliente,
    cliente: function (cid) { return estado.clientes.filter(function (c) { return c.id === cid; })[0]; },
    adicionar: function (c) { estado.clientes.push(c); gravar(); return c; },
    remover: function (cid) { estado.clientes = estado.clientes.filter(function (c) { return c.id !== cid; }); gravar(); },
    zerar: function () { estado = { versao: 1, exemplo: false, clientes: [] }; gravar(); },
    exemplo: function () { estado = exemplo(); gravar(); },
    exportar: function () { return JSON.stringify(estado, null, 1); },
    importar: function (txt) {
      var d = JSON.parse(txt);
      if (!d || !Array.isArray(d.clientes)) throw new Error("Arquivo sem a lista de clientes.");
      estado = d; estado.exemplo = false; gravar();
    },
  };
})();
