const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');

assert.doesNotMatch(admin, /hermes-list-card|data-hermes-id/, 'Hermes não pode criar um segundo card lateral');
assert.match(admin, /data-provider="hermes"/, 'seletor Hermes deve existir no mesmo grupo visual');
assert.match(admin, /getHermes\(b\)[\s\S]*data-provider="hermes"/, 'seletor só deve ser renderizado quando result.hermes existir');
assert.match(admin, /activeProvider === "hermes"[\s\S]*\bon\b/, 'seletor Hermes deve indicar seleção');

assert.match(admin, /displayMarkdown\s*\|\|\s*stepData\.editedMarkdown/, 'displayMarkdown deve ser a fonte editorial principal');
assert.match(admin, /renderHermesMarkdown\(/, 'Markdown deve ser renderizado formatado');
assert.match(admin, /DOMPurify\.sanitize/, 'HTML renderizado deve ser sanitizado');
assert.match(html, /marked(?:\.min)?\.js/, 'renderizador Markdown completo deve ser carregado');
assert.match(html, /purify(?:\.min)?\.js/, 'sanitizador deve ser carregado');
assert.doesNotMatch(admin, /class="hermes-response"/, 'Hermes não deve usar textarea editável');

for (const forbidden of ['data-hermes-state', 'data-hermes-card-state', 'hermes-notes', 'saveHermesStep', 'setHermesCardStatus']) {
  assert.doesNotMatch(admin, new RegExp(forbidden), `ação manual removida: ${forbidden}`);
}
assert.match(admin, /data-copy-hermes=/, 'Copiar deve estar sempre disponível no cabeçalho');
assert.match(admin, /data-toggle-hermes-markdown=/, 'alternância Markdown formatado/bruto deve existir');
assert.match(admin, /Ver Markdown/);
assert.match(admin, /Ver formatado/);
assert.match(admin, /<details class="hermes-technical">/, 'detalhes técnicos devem permanecer fechados');
assert.doesNotMatch(admin, /<details class="hermes-technical" open/, 'detalhes técnicos não podem iniciar abertos');

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

console.log('hermes admin readonly tests: ok');
