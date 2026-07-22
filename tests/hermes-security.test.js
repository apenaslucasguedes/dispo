const assert = require('node:assert/strict');
const { findPayloadSecurityIssue } = require('../hermes-security.js');

function issue(value, key = 'content') {
  return findPayloadSecurityIssue({ [key]: value });
}

const safeValues = [
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // SHA-256
  '0123456789abcdef0123456789abcdef', // MD5
  '0123456789abcdef0123456789abcdef01234567', // Git SHA-1
  '123e4567-e89b-42d3-a456-426614174000', // UUID
  'REG-001 ART-123 VAL-009 DEC-010 SRC-777',
  'matheus-bauck-fisioterapia-pediatrica',
  '2026-07-22T12:34:56.789Z',
  'https://example.org/projects/matheus-bauck-fisioterapia-pediatrica?ref=ART-001',
  '07_handoff_final/ART-031_m atheus/admin_payload.json'.replace('m atheus', 'matheus'),
  'projects/matheus-bauck-fisioterapia-pediatrica/07_handoff_final/admin_payload.json',
  'C:\\projects\\matheus-bauck-fisioterapia-pediatrica\\07_handoff_final\\admin_payload.json',
];
for (const value of safeValues) assert.equal(issue(value), null, `safe value blocked (${value.length} chars)`);

const disguisedOpaqueSecrets = [
  `https://example.org/${'Q'.repeat(60)}`,
  `artifacts/${'Q'.repeat(60)}.json`,
  'C:\\artifacts\\' + 'q'.repeat(60) + '.json',
  `alpha-beta-${'Q'.repeat(60)}`,
  `alpha-beta-${'q'.repeat(60)}`,
];
for (const value of disguisedOpaqueSecrets) {
  assert.equal(issue(value)?.ruleId, 'opaque-secret', 'opaque secret must not be hidden in a URL, path or pseudo-slug');
}

const secretCases = [
  ['secret-field-name', 'credential-field-name', { password: 'short' }],
  ['private-key', 'private-key', { content: '-----BEGIN PRIVATE KEY-----\nredacted\n-----END PRIVATE KEY-----' }],
  ['private-key', 'private-key', { content: '-----BEGIN ENCRYPTED PRIVATE KEY-----\nredacted\n-----END ENCRYPTED PRIVATE KEY-----' }],
  ['jwt', 'jwt', { content: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghijklmnopqrstuvwxyz012345' }],
  ['openai-token', 'provider-api-token', { content: `sk-${'A'.repeat(48)}` }],
  ['anthropic-token', 'provider-api-token', { content: `sk-ant-${'A'.repeat(48)}` }],
  ['github-token', 'provider-api-token', { content: `ghp_${'A'.repeat(36)}` }],
  ['aws-access-key', 'cloud-access-key', { content: `AKIA${'A'.repeat(16)}` }],
  ['google-api-key', 'cloud-api-key', { content: `AIza${'A'.repeat(35)}` }],
  ['supabase-service-role', 'supabase-service-role', { content: 'SUPABASE_SERVICE_ROLE_KEY' }],
  ['supabase-service-role', 'supabase-service-role', { role: 'service_role' }],
  ['opaque-secret', 'opaque-secret', { content: 'QwErTyUiOpAsDfGhJkLzXcVbNm1234567890QwErTyUiOpAsDfGhJkLzXcVbNm' }],
];
for (const [ruleId, category, payload] of secretCases) {
  const finding = findPayloadSecurityIssue(payload);
  assert.ok(finding, `${ruleId} should be blocked`);
  assert.equal(finding.ruleId, ruleId);
  assert.equal(finding.category, category);
  assert.equal(finding.path, Object.hasOwn(payload, 'password') ? '$.password' : Object.hasOwn(payload, 'role') ? '$.role' : '$.content');
  assert.equal(Object.hasOwn(finding, 'value'), false, 'finding must never expose the matched value');
}

const nested = findPayloadSecurityIssue({ steps: [{ artifacts: ['ok'], content: `prefix ghp_${'B'.repeat(36)} suffix` }] });
assert.deepEqual(nested, { path: '$.steps[0].content', ruleId: 'github-token', category: 'provider-api-token' });

console.log('hermes-security tests: ok');
