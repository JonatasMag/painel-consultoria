# Painel de Consultoria

CRM com funil para uma consultoria de dados e processos. Cada cliente passa por seis etapas, e o painel entrega o material de cada uma:

| Etapa | O que o painel entrega |
|---|---|
| 1. Diagnosticar | Questionário por tipo de empresa e relatório com nota por área, achados, plano recomendado e preço por região |
| 2. Organizar | 6 procedimentos padrão (POPs) com o nome do cliente e 6 planilhas Excel com fórmulas |
| 3. Medir | Dashboard simples e dashboard completo (modelos), kit Power BI e passo a passo de integração de dados |
| 4. Automatizar | Modelos de automação: Google Sheets, n8n, WhatsApp, landing page e site com painel |
| 5. Acompanhar | Plano mensal, reuniões, indicadores do cliente e avisos automáticos |
| 6. Treinar | Apostilas de 4 módulos, exercícios e certificados com o nome de cada participante |

**Endereço:** https://jonatasmag.github.io/painel-consultoria/ (acesso com senha).

## Acesso protegido

O painel pede senha. Os textos, os modelos e os arquivos de `materiais/` estão **criptografados** na pasta `cofre/` (AES-256-GCM, chave derivada da senha com PBKDF2-SHA256, 600 mil iterações). Sem a senha, quem abrir os arquivos do repositório ou do site vê só dados embaralhados. Os originais ficam fora deste repositório.

Os clientes de exemplo e todos os números dos modelos são **fictícios**.

## Como usar no dia a dia

1. Entre com a senha e clique em **Começar com meus clientes** para apagar os exemplos.
2. Cadastre o cliente. O **tipo de empresa** define as perguntas do diagnóstico e os serviços recomendados. A **UF** define a faixa de preço da região.
3. Na página do cliente, libere cada etapa quando combinar com ele. No **Funil**, dá para arrastar o cliente para a próxima etapa.
4. Marque o que foi entregue. Os avisos (reunião atrasada, etapa parada, indicador não lançado) aparecem no **Início** e em **Acompanhamento**.

### Onde ficam os dados

Os clientes ficam guardados **só no navegador** em que você usa o painel (armazenamento local). Ninguém mais vê, nem quem abre o mesmo endereço.

- Baixe um **backup** toda semana em **Configurações** e guarde no Google Drive ou no OneDrive.
- Para usar em outro computador, baixe o backup aqui e use **Restaurar backup** lá.
- Limpar os dados do navegador apaga os clientes. Por isso o backup é importante.

## Onde editar

Os textos, preços e materiais ficam na cópia original (fora do GitHub). Depois de editar, rode `SENHA="..." node scripts/cifrar.mjs <pasta deste repositório>` na cópia original e envie a pasta `cofre/` atualizada. O mesmo comando, com outra senha, troca a senha do painel.

## Tecnologia

HTML, CSS e JavaScript puros, sem build e sem bibliotecas externas. Criptografia com a Web Crypto do próprio navegador. Gráficos em SVG desenhados pelo próprio código. Planilhas geradas com Python (openpyxl). Roda direto no GitHub Pages.

---

Feito por [Jonatas Magalhães](https://jonatasmag.github.io) · [LinkedIn](https://www.linkedin.com/in/jonatasmag/)
