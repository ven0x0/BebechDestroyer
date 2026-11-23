import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const FILE_NAME = 'BebechDestroyer.apk';
const digest = (data) => 'sha256:' + createHash('sha256').update(data).digest('hex');

function github(repository, token) {
  if (!/^[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+$/.test(repository) || !token)
    throw new Error('Brak danych repozytorium.');
  return async function request(method, path, body, allow404 = false) {
    const upload = Buffer.isBuffer(body);
    const host = upload ? 'uploads.github.com' : 'api.github.com';
    const response = await fetch(`https://${host}/repos/${repository}${path}`, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(60000),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body
          ? { 'Content-Type': upload ? 'application/vnd.android.package-archive' : 'application/json' }
          : {})
      },
      body: body ? (upload ? body : JSON.stringify(body)) : undefined
    });
    if (allow404 && response.status === 404) return null;
    if (!response.ok) throw Error(`GitHub ${method} ${path}: HTTP ${response.status}.`);
    if (response.status === 204) return null;
    return response.json();
  };
}

async function findRelease(api, tag) {
  const existing = await api('GET', `/releases/tags/${tag}`, undefined, true);
  if (existing) return existing;
  // Drafts can exist before the tag is created and be absent from the tag endpoint.
  for (let page = 1; ; page++) {
    const releases = await api('GET', `/releases?per_page=100&page=${page}`);
    const matching = releases.find((release) => release.tag_name === tag);
    if (matching) return matching;
    if (releases.length < 100) return null;
  }
}

export async function publish({ api, sha, code, version, bytes }) {
  if (
    !/^[0-9a-f]{40}$/.test(sha) ||
    !Number.isSafeInteger(code) ||
    code <= 4 ||
    code > 2100000000 ||
    !/^\d+(?:\.\d+){1,3}$/.test(version) ||
    bytes.length < 1
  )
    throw Error('Nieprawidłowy opis wydania.');
  const current = async () => (await api('GET', '/git/ref/heads/master')).object.sha === sha;
  if (!(await current())) return 'Pominięto starszy commit.';

  const tag = `android-${code}`,
    name = `BebechDestroyer ${version}`,
    expected = digest(bytes);
  let release = await findRelease(api, tag);
  const tagRef = await api('GET', `/git/ref/tags/${tag}`, undefined, true);
  if (tagRef) {
    const commit = await api('GET', `/commits/${tag}`);
    if (commit.sha !== sha) throw Error('Tag wydania wskazuje inny commit.');
  }
  const assetOf = (r) => r.assets.find((asset) => asset.name === FILE_NAME);
  if (release && !release.draft) {
    const asset = assetOf(release);
    if (!tagRef || !asset || asset.state !== 'uploaded' || !/^sha256:[0-9a-f]{64}$/.test(asset.digest))
      throw Error('Opublikowane wydanie ma niepełne dane.');
    // Rebuilds can have different bytes. Leave the already released and verified APK intact.
    return 'Ten commit ma już opublikowane wydanie.';
  }
  if (release && release.target_commitish !== sha) throw Error('Szkic wydania wskazuje inny commit.');
  if (!release)
    release = await api('POST', '/releases', {
      tag_name: tag,
      target_commitish: sha,
      name,
      draft: true,
      body: `Wydanie aplikacji z gałęzi master. Commit ${sha}.`
    });
  const path = `/releases/${release.id}`;
  let asset = assetOf(release);
  if (asset?.digest !== expected || asset.state !== 'uploaded') {
    if (asset) await api('DELETE', `/releases/assets/${asset.id}`);
    asset = await api('POST', `${path}/assets?name=${FILE_NAME}`, bytes);
  }
  if (
    asset.name !== FILE_NAME ||
    asset.digest !== expected ||
    asset.size !== bytes.length ||
    asset.state !== 'uploaded'
  )
    throw Error('GitHub zwrócił inną sumę kontrolną lub rozmiar przesłanego APK.');
  if (!(await current())) return 'Pojawił się nowszy commit. Zostawiono szkic.';
  const published = await api('PATCH', path, { draft: false, prerelease: false, make_latest: 'true' });
  if (published.draft || published.tag_name !== tag || assetOf(published)?.digest !== expected)
    throw Error('Nie udało się potwierdzić publikacji APK.');
  return `Opublikowano ${name}, ${tag}.`;
}
export async function publishLocal({ repository, sha, code, version, apk, ghPath = 'gh' }) {
  if (process.env.GITHUB_ACTIONS === 'true') throw Error('Podpisane wydania publikuje komputer właściciela.');
  // gh reads the active login from the operating system credential store.
  // Capture it directly, never copy it into a file, CLI argument, or workflow log.
  const login = spawnSync(ghPath, ['auth', 'token', '--hostname', 'github.com'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  if (login.status !== 0 || !login.stdout.trim())
    throw Error('Zaloguj GitHub CLI na komputerze właściciela.');
  return publish({
    api: github(repository, login.stdout.trim()),
    sha,
    code,
    version,
    bytes: await readFile(apk)
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [repository, sha, code, version, apk, ghPath] = process.argv.slice(2);
  console.log(await publishLocal({ repository, sha, code: Number(code), version, apk, ghPath }));
}
