import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { publish } from './publish.mjs';

const sha = '0'.repeat(40),
  other = '1'.repeat(40),
  filename = 'BebechDestroyer.apk',
  code = 1001;
const bytes = Buffer.from('PK-test-fixture');
const checksum = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
function service(options = {}) {
  let release = options.release ? structuredClone(options.release) : null,
    headCalls = 0;
  const writes = [];
  async function api(method, path, body) {
    if (method !== 'GET') writes.push([method, path]);
    if (path === '/git/ref/heads/master')
      return { object: { sha: (++headCalls === 1 ? options.atStart : options.atPublish) || sha } };
    if (path === '/git/ref/tags/android-1001')
      return options.tagSha || (release && !release.draft) ? { object: { type: 'commit' } } : null;
    if (path === '/commits/android-1001') return { sha: options.tagSha || sha };
    if (path === '/releases/tags/android-1001') return release?.draft ? null : release;
    if (path === '/releases?per_page=100&page=1') return release ? [release] : [];
    if (method === 'POST' && path === '/releases') {
      release = { ...body, id: 3, assets: [] };
      return release;
    }
    if (method === 'DELETE' && path === '/releases/assets/9') {
      release.assets = [];
      return null;
    }
    if (method === 'POST' && path === '/releases/3/assets?name=' + filename) {
      assert.deepEqual(body, bytes);
      const asset = {
        id: 9,
        name: filename,
        size: bytes.length,
        state: 'uploaded',
        digest: options.digest || checksum
      };
      release.assets = [asset];
      return asset;
    }
    if (method === 'PATCH' && path === '/releases/3') {
      assert.equal(body.make_latest, 'true');
      Object.assign(release, body);
      return release;
    }
    throw Error('Niespodziewany krok ' + method + ' ' + path);
  }
  const run = () => publish({ api, sha, code, version: '1.3.1', bytes });
  return {
    run,
    writes,
    get release() {
      return release;
    }
  };
}
test('a release appears in latest only after its draft asset digest matches, and retries preserve the public APK', async () => {
  const s = service();
  await s.run();
  assert.equal(s.release.tag_name, 'android-1001');
  assert.equal(s.release.target_commitish, sha);
  assert.equal(s.release.draft, false);
  assert.equal(s.release.assets[0].digest, checksum);
  assert.deepEqual(
    s.writes.map((x) => x[0]),
    ['POST', 'POST', 'PATCH']
  );
  await s.run();
  assert.equal(s.writes.length, 3);
});
test('an interrupted draft can finish without uploading its identical asset again', async () => {
  const s = service({ atPublish: other });
  await s.run();
  assert.equal(s.release.draft, true);
  const fresh = service({ release: s.release });
  await fresh.run();
  assert.deepEqual(fresh.writes, [['PATCH', '/releases/3']]);
});
test('a corrupt draft upload can be retried without touching any published asset', async () => {
  const s = service({ digest: 'sha256:' + 'f'.repeat(64) });
  await assert.rejects(s.run, /kontrolną/);
  assert.equal(s.release.draft, true);
  const retry = service({ release: s.release });
  await retry.run();
  assert.equal(retry.release.assets[0].digest, checksum);
  assert.deepEqual(
    retry.writes.map((x) => x[0]),
    ['DELETE', 'POST', 'PATCH']
  );
});
test('a superseded run, conflicting tag or draft for another commit cannot publish', async () => {
  const stale = service({ atStart: other });
  await stale.run();
  assert.deepEqual(stale.writes, []);
  const conflict = service({ tagSha: other });
  await assert.rejects(conflict.run, /inny commit/);
  assert.deepEqual(conflict.writes, []);
  const reserved = service({ release: { tag_name: 'android-1001', draft: true, target_commitish: other } });
  await assert.rejects(reserved.run, /inny commit/);
  assert.deepEqual(reserved.writes, []);
});
