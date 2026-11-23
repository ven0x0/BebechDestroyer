'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict');
const { protect, policies, matches } = require('../admin/protect-master.cjs');
function github() {
  const repo = 'repos/alice/rozstaw',
    sha = 'f'.repeat(40);
  const rulesets = new Map(),
    calls = [];
  let nextId = 31;
  const me = { id: 17, login: 'alice' };
  const meta = { owner: { type: 'User', id: 17 }, default_branch: 'master', permissions: { admin: true } };
  const check = {
    name: 'testy-master',
    conclusion: 'success',
    head_sha: sha,
    app: { slug: 'github-actions', id: 23 }
  };
  function api(method, path, body) {
    calls.push({ method, path, body });
    if (method === 'POST' && path === repo + '/rulesets') {
      const id = nextId++;
      rulesets.set(id, { ...structuredClone(body), id });
      return { id };
    }
    assert.equal(method, 'GET');
    if (path === 'user') return me;
    if (path === repo) return meta;
    if (path === repo + '/branches/master') return { commit: { sha } };
    if (path === repo + '/commits/' + sha + '/check-runs?check_name=testy-master&filter=latest&per_page=100')
      return { check_runs: [check] };
    if (path === repo + '/rulesets?includes_parents=false&per_page=100&page=1')
      return Array.from(rulesets, ([id, r]) => ({ id, name: r.name }));
    if (path.startsWith(repo + '/rulesets/')) return rulesets.get(Number(path.split('/').at(-1)));
    throw Error('Unexpected ' + path);
  }
  return { api, me, meta, check, calls, rulesets };
}
test('only the owner can merge via PR and neither account nor integration can skip CI', () => {
  const [gate, ci] = policies(17, 23);
  assert.deepEqual(gate.bypass_actors, [{ actor_type: 'User', actor_id: 17, bypass_mode: 'pull_request' }]);
  assert.deepEqual(gate.rules, [{ type: 'update', parameters: { update_allows_fetch_and_merge: false } }]);
  assert.deepEqual(ci.bypass_actors, []);
  assert.equal(ci.rules.find((r) => r.type === 'pull_request').parameters.required_approving_review_count, 0);
  assert.deepEqual(ci.rules.find((r) => r.type === 'required_status_checks').parameters, {
    required_status_checks: [{ context: 'testy-master', integration_id: 23 }],
    strict_required_status_checks_policy: true
  });
  for (const rule of [gate, ci])
    assert.deepEqual(rule.conditions.ref_name, { include: ['refs/heads/master'], exclude: [] });
});
test('first run installs and verifies both rules; repeats and audit perform no writes', () => {
  const g = github(),
    name = 'alice/rozstaw';
  assert.deepEqual(protect(name, false, g.api), {
    owner: 'alice',
    links: [
      'https://github.com/alice/rozstaw/settings/rules/31',
      'https://github.com/alice/rozstaw/settings/rules/32'
    ]
  });
  assert.equal(g.calls.filter((c) => c.method === 'POST').length, 2);
  g.calls.length = 0;
  protect(name, false, g.api);
  protect(name, true, g.api);
  assert.ok(g.calls.every((c) => c.method === 'GET'));
  const prior = g.rulesets.get(31);
  g.rulesets.delete(31);
  assert.throws(() => protect(name, true, g.api), /Brak aktywnej/);
  assert.equal(g.rulesets.size, 1);
  protect(name, false, g.api);
  assert.ok([...g.rulesets.values()].some((r) => matches(r, prior)));
});
test('rejects another account, wrong branch, missing HEAD check, failures and lookalike app', () => {
  for (const change of [
    (g) => (g.me.id = 99),
    (g) => (g.meta.permissions.admin = false),
    (g) => (g.meta.default_branch = 'main'),
    (g) => (g.check.app.slug = 'external'),
    (g) => (g.check.head_sha = 'old'),
    (g) => (g.check.conclusion = 'failure'),
    (g) => (g.check.conclusion = 'skipped')
  ]) {
    const g = github();
    change(g);
    assert.throws(() => protect('alice/rozstaw', false, g.api));
    assert.equal(g.rulesets.size, 0);
  }
});
test('detects drift without overwriting other rules or replacing an existing gate', () => {
  const g = github();
  const [, ci] = policies(17, 23);
  ci.bypass_actors.push({ actor_type: 'User', actor_id: 23, bypass_mode: 'always' });
  g.rulesets.set(44, { ...ci, id: 44 });
  assert.throws(() => protect('alice/rozstaw', false, g.api), /różnią/);
  assert.equal(g.rulesets.size, 1);
  assert.equal(
    g.calls.some((c) => c.method !== 'GET'),
    false
  );
});
test('detects extra bypass users, disabled or retargeted rules, or an unbound test', () => {
  const [gate, ci] = policies(17, 23);
  assert.equal(matches({ ...gate, enforcement: 'disabled' }, gate), false);
  assert.equal(
    matches(
      { ...gate, conditions: { ref_name: { include: ['~ALL'], exclude: ['refs/heads/master'] } } },
      gate
    ),
    false
  );
  assert.equal(
    matches(
      {
        ...gate,
        bypass_actors: [...gate.bypass_actors, { actor_type: 'User', actor_id: 22, bypass_mode: 'always' }]
      },
      gate
    ),
    false
  );
  const copy = structuredClone(ci);
  delete copy.rules[1].parameters.required_status_checks[0].integration_id;
  assert.equal(matches(copy, ci), false);
});
test('a bare GitHub update rule blocks fetch-and-merge and an explicit exception fails the audit', () => {
  const [gate] = policies(17, 23);
  assert.equal(matches({ ...gate, rules: [{ type: 'update' }] }, gate), true);
  const rules = [{ type: 'update', parameters: { update_allows_fetch_and_merge: true } }];
  assert.equal(matches({ ...gate, rules }, gate), false);
});
