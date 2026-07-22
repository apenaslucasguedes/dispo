const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'supabase', 'functions', 'hermes-sync', 'index.ts'), 'utf8');

assert.match(admin, /class="briefing-item hermes-list-card/, 'Hermes deve criar um card lateral virtual separado');
assert.match(admin, /data-hermes-id=/, 'card virtual deve apontar para o briefing canônico existente');
assert.match(admin, /getHermes\(b\)[\s\S]*hermes-list-card/, 'card só deve ser renderizado quando result.hermes existir');
assert.doesNotMatch(admin, /data-provider="hermes"/, 'Hermes não pode continuar como seletor interno do card nativo');
assert.match(admin, /hermes\.cardTitle/, 'título do card deve vir da identidade visual cardTitle');
assert.match(admin, /\$\{ICON_AI_HERMES\}/, 'card Hermes deve usar o ícone Hermes');
const aiNavigation = admin.slice(admin.indexOf('document.querySelectorAll("[data-ai-briefing]'), admin.indexOf('document.querySelectorAll("[data-hermes-id]'));
assert.match(aiNavigation, /activeProvider\s*=\s*"native"/, 'clicar Claude ou GPT deve sair do painel Hermes');

assert.match(admin, /displayMarkdown\s*\|\|\s*stepData\.editedMarkdown/, 'displayMarkdown deve ser a fonte editorial principal');
assert.match(admin, /renderHermesMarkdown\(/, 'Markdown deve ser renderizado formatado');
assert.match(admin, /DOMPurify\.sanitize/, 'HTML renderizado deve ser sanitizado');
assert.match(html, /marked(?:\.min)?\.js/, 'renderizador Markdown completo deve ser carregado');
assert.match(html, /purify(?:\.min)?\.js/, 'sanitizador deve ser carregado');
assert.doesNotMatch(admin, /class="hermes-response"/, 'Hermes não deve usar textarea editável');

for (const forbidden of ['data-hermes-state', 'data-hermes-card-state', 'setHermesCardStatus']) {
  assert.doesNotMatch(admin, new RegExp(forbidden), `ação manual removida: ${forbidden}`);
}
assert.match(admin, /data-copy-hermes=/, 'Copiar deve estar sempre disponível no cabeçalho');
assert.match(admin, /data-toggle-hermes-markdown=/, 'alternância Markdown formatado/bruto deve existir');
assert.match(admin, /Ver Markdown/);
assert.match(admin, /Ver formatado/);
assert.match(admin, /<details class="hermes-technical">/, 'detalhes técnicos devem permanecer fechados');
assert.doesNotMatch(admin, /<details class="hermes-technical" open/, 'detalhes técnicos não podem iniciar abertos');
assert.match(admin, /Observação opcional/, 'cada etapa deve aceitar observação editorial separada');
assert.match(admin, /data-hermes-notes=/, 'observação deve usar controle próprio por etapa');
assert.match(admin, /data-save-hermes-note=/, 'observação deve ter ação de salvar dedicada');
assert.match(admin, /async function saveHermesNote/, 'salvamento dedicado deve preservar o restante do namespace');
const noteSaver = admin.slice(admin.indexOf('async function saveHermesNote'), admin.indexOf('function hermesDetailBlock'));
assert.match(noteSaver, /structuredClone\(existingHermes\)/, 'salvamento deve clonar o snapshot protegido por concorrência');
assert.match(noteSaver, /step\.notes\s*=/, 'salvamento deve alterar somente notes da etapa');
assert.doesNotMatch(noteSaver, /hasHumanEdit|editedMarkdown|\.status\s*=/, 'observação não pode editar Markdown nem status');
assert.match(sync, /notes:\s*prev\.notes\s*\|\|\s*""/, 'sincronização automática deve preservar observações existentes');

assert.match(admin, /content\.trim\(\)/, 'progresso Hermes deve contar etapas com conteúdo');
assert.doesNotMatch(admin.slice(admin.indexOf('function hermesProgress'), admin.indexOf('function hermesListBadge')), /aprovado/, 'progresso não pode depender de aprovação');
assert.match(admin, /Pronto para revisão/);
assert.match(admin, /Em processamento/);
assert.match(admin, /Erro/);
assert.match(admin, /sincronizado automaticamente/i);

assert.doesNotMatch(html.slice(0, html.indexOf('<main')), /id="hermesImportBtn"/, 'Importar Hermes não deve ficar na área principal');
assert.match(html, /<details[^>]*class="manual-recovery"[\s\S]*Recuperação manual[\s\S]*id="hermesImportBtn"/, 'fallback deve ficar em seção fechada de recuperação');
assert.match(css, /\.hermes-markdown[\s\S]*table/);
assert.match(css, /overflow-x:\s*auto/);
assert.match(css, /@media \(max-width:\s*640px\)/);
assert.match(css, /--hermes-blue:\s*#0057FF/i, 'direção visual deve usar o azul elétrico aprovado');
assert.match(css, /\.hermes-list-card\.active[\s\S]*background:\s*var\(--hermes-blue\)[\s\S]*color:\s*#fff/i, 'card ativo deve ser azul com conteúdo branco');

console.log('hermes admin readonly tests: ok');
