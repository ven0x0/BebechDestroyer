'use strict';

const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const checkName = 'master-checks';
const usage = 'node admin/protect-master.cjs LOGIN/REPO [--verify]';

function policies(ownerId, actionsId) {
  const base = {
    target: 'branch',
    enforcement: 'active',
    conditions: { ref_name: { include: ['refs/heads/master'], exclude: [] } }
  };
  return [
    {
      ...base,
      name: 'BebechDestroyer master - decyzja wlasciciela',
      bypass_actors: [{ actor_type: 'User', actor_id: ownerId, bypass_mode: 'pull_request' }],
      rules: [{ type: 'update', parameters: { update_allows_fetch_and_merge: false } }]
    },
    {
      ...base,
      name: 'BebechDestroyer master - wymagane testy',
      bypass_actors: [],
      rules: [
        {
          type: 'pull_request',
          parameters: {
            required_approving_review_count: 0,
            require_code_owner_review: false,
            dismiss_stale_reviews_on_push: false,
            require_last_push_approval: false,
            required_review_thread_resolution: false
          }
        },
        {
          type: 'required_status_checks',
          parameters: {
            required_status_checks: [{ context: checkName, integration_id: actionsId }],
            strict_required_status_checks_policy: true
          }
        },
        { type: 'non_fast_forward' },
        { type: 'deletion' }
      ]
    }
  ];
}

// GET returns repository metadata and additional default parameters. Compare the
// enforcement fields explicitly and keep unrelated settings in place.
function matches(actual, wanted) {
  if (['name', 'enforcement', 'target'].some((k) => actual[k] !== wanted[k])) return false;
  if (!isDeepStrictEqual(actual.conditions, wanted.conditions)) return false;
  if (!Array.isArray(actual.bypass_actors) || actual.bypass_actors.length !== wanted.bypass_actors.length)
    return false;
  if (
    !wanted.bypass_actors.every((actor, i) =>
      Object.entries(actor).every(([k, v]) => actual.bypass_actors[i][k] === v)
    )
  )
    return false;
  if (!Array.isArray(actual.rules) || actual.rules.length !== wanted.rules.length) return false;
  return wanted.rules.every((rule) => {
    const found = actual.rules.find((r) => r.type === rule.type);
    if (!found) return false;
    // GitHub omits this optional switch when fetch-and-merge is disabled.
    if (rule.type === 'update') return (found.parameters?.update_allows_fetch_and_merge ?? false) === false;
    return Object.entries(rule.parameters || {}).every(([key, value]) =>
      isDeepStrictEqual(found.parameters?.[key], value)
    );
  });
}

function ghApi(method, path, body) {
  const args = [
    'api',
    '--hostname',
    'github.com',
    '--method',
    method,
    '--header',
    'X-GitHub-Api-Version: 2026-03-10',
    path
  ];
  if (body) args.push('--input', '-');
  const result = spawnSync(process.env.ROZSTAW_GH || 'gh', args, {
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    input: body ? JSON.stringify(body) : undefined
  });
  if (result.error)
    throw new Error(
      result.error.code === 'ENOENT'
        ? 'Zainstaluj GitHub CLI (gh) lub ustaw ROZSTAW_GH.'
        : result.error.message
    );
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || `GitHub odmówił wykonania ${method} ${path}.`);
  return JSON.parse(result.stdout);
}

function protect(repoName, verifyOnly, api = ghApi) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repoName) || /\/\.{1,2}$/.test(repoName))
    throw new Error(usage);
  const repoPath = 'repos/' + repoName;
  const me = api('GET', 'user');
  const repo = api('GET', repoPath);
  if (
    !Number.isSafeInteger(me.id) ||
    me.id <= 0 ||
    !repo.permissions?.admin ||
    (repo.owner.type === 'User' && repo.owner.id !== me.id)
  )
    throw new Error(
      'Zaloguj się w gh na konto właściciela repozytorium osobistego lub wybranego administratora repozytorium organizacji.'
    );
  if (repo.default_branch !== 'master')
    throw new Error('Ustaw master jako gałąź domyślną tego projektu przed włączeniem ochrony.');
  const sha = api('GET', repoPath + '/branches/master').commit.sha;
  const reports = api(
    'GET',
    repoPath + '/commits/' + sha + '/check-runs?check_name=' + checkName + '&filter=latest&per_page=100'
  );
  const checks = reports.check_runs.filter(
    (run) => run.name === checkName && run.head_sha === sha && run.app?.slug === 'github-actions'
  );
  if (
    checks.length !== 1 ||
    !Number.isSafeInteger(checks[0].app.id) ||
    checks[0].app.id <= 0 ||
    (!verifyOnly && checks[0].conclusion !== 'success')
  )
    throw new Error(
      `Sprawdź na GitHubie zadanie ${checkName} na aktualnym masterze (${sha.slice(0, 8)}). Instalacja wymaga jego poprawnego zakończenia.`
    );
  const expected = policies(me.id, checks[0].app.id);
  const all = [];
  for (let page = 1; ; page++) {
    const list = api('GET', repoPath + '/rulesets?includes_parents=false&per_page=100&page=' + page);
    all.push(...list);
    if (list.length < 100) break;
  }
  const collections = repoPath + '/rulesets';
  // Inspect both before creating anything. Re-running finishes any interrupted setup.
  const existing = expected.map((wanted) => {
    const sameName = all.filter((r) => r.name === wanted.name);
    if (sameName.length > 1) throw new Error(`Niejednoznaczna nazwa zestawu reguł „${wanted.name}”.`);
    if (!sameName.length) {
      if (verifyOnly) throw new Error(`Brak aktywnej reguły „${wanted.name}”.`);
      return null;
    }
    const actual = api('GET', collections + '/' + sameName[0].id);
    if (!matches(actual, wanted))
      throw new Error(
        `Ustawienia „${wanted.name}” różnią się od oczekiwanych. Sprawdź https://github.com/${repoName}/settings/rules/${sameName[0].id}`
      );
    return sameName[0].id;
  });
  const links = [];
  for (const [index, wanted] of expected.entries()) {
    const id = existing[index] || api('POST', collections, wanted).id;
    if (!Number.isSafeInteger(id) || !matches(api('GET', collections + '/' + id), wanted))
      throw new Error(`GitHub nie potwierdził reguły „${wanted.name}”.`);
    links.push(`https://github.com/${repoName}/settings/rules/${id}`);
  }
  return { owner: me.login, links };
}

if (require.main === module) {
  try {
    const [repository, option, ...extra] = process.argv.slice(2);
    if (!repository || (option && option !== '--verify') || extra.length) throw new Error(usage);
    const result = protect(repository, option === '--verify');
    console.log(
      `Potwierdzono reguły master. Decyzja o scaleniu należy do @${result.owner}. Wymagane zadanie GitHub Actions to ${checkName}.`
    );
    for (const link of result.links) console.log(link);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { protect, policies, matches };
