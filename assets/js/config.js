/* =============================================================
 * CONFIGURAÇÃO DO PAINEL
 * Cole aqui os dados do seu projeto no Supabase
 * (Project Settings > API). A chave "anon public" pode ficar
 * no site: quem protege os dados são as regras do banco.
 * Com os dois campos vazios, o painel abre só com a senha do cofre.
 * ============================================================= */
window.PAINEL_CONFIG = {
  supabaseUrl: "https://drvqdsgceyembhtiqdhm.supabase.co",       // exemplo: "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydnFkc2djZXllbWJodGlxZGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMTAxMzgsImV4cCI6MjEwNTY4NjEzOH0.D7flxZ-vevEW2SWmDHO6WvL__2NKjZi-GvrvF3AL3uI",   // a chave longa "anon public"

  // Login dos clientes: entram com o nome do cadastro e esta senha (divulgada no portfólio).
  // O e-mail verdadeiro fica guardado no cadastro; o login usa um endereço interno feito do nome.
  loginCliente: { senha: "Cliente", dominio: "clientes.jonatasmag.github.io" },

  whatsapp: "5547988499129",
  email: "chazaq.adm@gmail.com",
  portfolio: "https://jonatasmag.github.io/",
};
