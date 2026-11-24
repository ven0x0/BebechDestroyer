import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publishLocal } from '../ci/publish.mjs';

const limit = 70 * 1024 * 1024;
const workflowPath = '.github/workflows/android.yml';
const shaPattern = /^[0-9a-f]{40}$/;
const isId = n => Number.isSafeInteger(n) && n > 0;
const safeRepo = s => /^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(s) && !['.', '..'].includes(s.split('/')[1]);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const idle = message => ({ ready: false, message });

function call(exe, args, extra = {}) {
  const result = spawnSync(exe, args, {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 3 * 1024 * 1024,
    timeout: 90000, ...extra
  });
  // Stderr can contain signed redirect URLs. Only report the operation and process status.
  if (result.status !== 0 || result.error) throw Error(
    'Nie udało się wykonać ' + (args[0] === 'api' ? 'GitHub API' : 'Git') +
    ' (' + (result.error?.code || result.status) + '). Sprawdź połączenie i logowanie gh.');
  return result.stdout;
}

export function eligibleRun(run, workflow, repo, head) {
  return isId(run?.id) && isId(run.run_attempt) && isId(repo.id) && isId(workflow.id)
    && run.workflow_id === workflow.id && run.path === workflowPath
    && run.repository?.id === repo.id && run.head_repository?.id === repo.id
    && run.head_branch === 'master' && run.head_sha === head && shaPattern.test(head)
    && ['push', 'workflow_dispatch'].includes(run.event)
    && run.actor?.id === repo.owner.id && isId(repo.owner.id)
    && (!run.triggering_actor || run.triggering_actor.id === repo.owner.id)
    && run.status === 'completed' && run.conclusion === 'success';
}

export function verifyJobs(jobs, run) {
  for (const name of ['master-checks', 'unsigned-android']) {
    const matches = jobs.filter(j => j.name === name);
    const job = matches[0];
    assert(matches.length === 1 && job.run_id === run.id && job.head_sha === run.head_sha
      && job.status === 'completed' && job.conclusion === 'success'
      && Array.isArray(job.labels) && job.labels.includes('ubuntu-24.04') && !job.labels.includes('self-hosted'),
      'Brak zaliczonego zadania GitHub Actions ' + name + ' dla tej wersji.');
  }
}

export function selectArtifact(artifacts, run, repo) {
  const matches = artifacts.filter(a => a.name === 'unsigned-android-' + run.head_sha && !a.expired);
  const a = matches[0];
  assert(matches.length === 1 && isId(a.id) && a.workflow_run?.id === run.id
    && a.workflow_run.head_sha === run.head_sha && a.workflow_run.head_branch === 'master'
    && a.workflow_run.repository_id === repo.id && a.workflow_run.head_repository_id === repo.id
    && /^sha256:[0-9a-f]{64}$/.test(a.digest) && isId(a.size_in_bytes) && a.size_in_bytes <= limit,
    'Artefakt wydania jest niedostępny albo ma niezgodne pochodzenie, rozmiar lub sumę SHA-256.');
  return a;
}

export function verifyDownload(bytes, artifact) {
  assert(bytes.length === artifact.size_in_bytes && bytes.length <= limit
    && 'sha256:' + createHash('sha256').update(bytes).digest('hex') === artifact.digest,
    'Archiwum pobrane z GitHuba ma inną sumę SHA-256 lub rozmiar.');
}

function commitCount(git, repo, dir, head) {
  const bare = join(dir, 'history.git');
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.toUpperCase().startsWith('GIT_')));
  Object.assign(env, { GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' });
  const exec = args => call(git, args, { env, encoding: 'utf8', cwd: dir }).trim();
  exec(['init', '--quiet', '--bare', '--template=', bare]);
  exec(['--git-dir', bare, '-c', 'credential.helper=', '-c', 'http.followRedirects=false', 'fetch',
    '--quiet', '--no-tags', '--no-recurse-submodules', '--filter=blob:none',
    'https://github.com/' + repo + '.git', 'refs/heads/master:refs/heads/master']);
  if (exec(['--git-dir', bare, 'rev-parse', 'refs/heads/master']) !== head) return null;
  const count = Number(exec(['--git-dir', bare, 'rev-list', '--first-parent', '--count', 'refs/heads/master']));
  assert(isId(count) && count <= 2099999000, 'Nieprawidłowa liczba commitów master.');
  return count;
}

export async function prepare({ repository, directory, gh, git }) {
  assert(safeRepo(repository), 'Nieprawidłowa nazwa repozytorium.');
  const get = path => JSON.parse(call(gh, ['api', '--hostname', 'github.com', path], { encoding: 'utf8' }));
  const base = 'repos/' + repository;
  const repo = get(base);
  const account = get('user');
  assert(!repo.private && repo.full_name?.toLowerCase() === repository.toLowerCase() && repo.owner?.type === 'User'
    && isId(repo.id) && isId(account.id) && repo.owner.id === account.id,
    'Podpis wymaga publicznego repozytorium i zalogowanego konta jego właściciela.');
  const head = get(base + '/git/ref/heads/master').object?.sha;
  assert(shaPattern.test(head), 'Brak poprawnego commita na master.');
  const published = get(base + '/releases?per_page=30').find(r =>
    r.target_commitish === head && !r.draft && !r.prerelease && /^android-[1-9][0-9]*$/.test(r.tag_name)
    && r.assets?.some(a => a.name === 'BebechDestroyer.apk' && a.state === 'uploaded' && /^sha256:[0-9a-f]{64}$/.test(a.digest)));
  if (published && get(base + '/commits/' + published.tag_name).sha === head) {
    return idle('Ten commit ma już opublikowane wydanie.');
  }
  const flow = get(base + '/actions/workflows/android.yml');
  assert(flow.path === workflowPath && flow.state === 'active' && isId(flow.id), 'Nieprawidłowy workflow Android.');
  const listed = get(base + '/actions/workflows/' + flow.id + '/runs?head_sha=' + head + '&branch=master&per_page=100');
  const candidate = listed.workflow_runs.find(r => eligibleRun(r, flow, repo, head));
  if (!candidate) return idle('Czekam na udany przebieg testów i budowy dla aktualnego master.');
  const run = get(base + '/actions/runs/' + candidate.id);
  assert(eligibleRun(run, flow, repo, head), 'Przebieg zmienił stan przed podpisaniem.');
  const jobs = get(base + '/actions/runs/' + run.id + '/attempts/' + run.run_attempt + '/jobs?per_page=100');
  verifyJobs(jobs.jobs, run);
  const listedArtifacts = get(base + '/actions/runs/' + run.id + '/artifacts?per_page=100');
  const artifactsForHead = listedArtifacts.artifacts.filter(a => a.name === 'unsigned-android-' + head);
  if (artifactsForHead.length && artifactsForHead.every(a => a.expired)
      || !artifactsForHead.length && Date.now() - Date.parse(run.updated_at) > 30 * 86400000) {
    const requested = listed.workflow_runs.some(r => r.event === 'workflow_dispatch' && r.head_sha === head
      && (r.status !== 'completed' || Date.now() - Date.parse(r.created_at) < 86400000));
    if (!requested) {
      call(gh, ['api','--hostname','github.com','--method','POST',
        base + '/actions/workflows/' + flow.id + '/dispatches','-f','ref=master']);
    }
    return idle('Czekam na odbudowanie wygaslego artefaktu master.');
  }
  const asset = selectArtifact(listedArtifacts.artifacts, run, repo);
  const count = commitCount(git, repository, directory, head);
  if (count === null) return idle('Pojawił się nowszy commit na master.');
  const bytes = call(gh, ['api', '--hostname', 'github.com', base + '/actions/artifacts/' + asset.id + '/zip'],
    { maxBuffer: limit, timeout: 180000 });
  verifyDownload(bytes, asset);
  if (get(base + '/git/ref/heads/master').object.sha !== head) return idle('Pojawił się nowszy commit na master.');
  writeFileSync(join(directory, 'artifact.zip'), bytes, { flag: 'wx' });
  return { ready: true, sha: head, code: 1000 + count, version: '1.3.' + count, repository, runId: run.id };
}

async function cli() {
  const [command, repository, directory, gh, git] = process.argv.slice(2);
  assert(process.env.GITHUB_ACTIONS !== 'true', 'Publikacja wymaga komputera właściciela.');
  if (command === 'prepare') {
    const result = await prepare({ repository, directory, gh, git });
    writeFileSync(join(directory, 'decision.json'), JSON.stringify(result), { flag: 'wx' });
    if (!result.ready) console.log(result.message);
  } else if (command === 'publish') {
    const info = JSON.parse(readFileSync(join(directory, 'decision.json'), 'utf8'));
    assert(info.ready && info.repository === repository, 'Brak sprawdzonego wydania.');
    console.log(await publishLocal({ ...info, apk: join(directory, 'BebechDestroyer.apk'), ghPath: gh }));
  } else throw Error('Nieznana operacja.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  cli().catch(e => { console.error(e.message); process.exitCode = 1; });
}
