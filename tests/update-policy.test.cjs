'use strict';

const { after, before, test } = require('node:test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const javaHome = process.env.JAVA_HOME;
const exe = name => javaHome ? path.join(javaHome, 'bin', name + (process.platform === 'win32' ? '.exe' : '')) : name;
let dir;

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bebech-update-tests-'));
  const policy = path.join(__dirname, '../app/src/main/java/pl/rozstaw/app/UpdatePolicy.java');
  execFileSync(exe('javac'), ['-encoding', 'UTF-8', '-d', dir, policy, path.join(__dirname, 'UpdatePolicyChecks.java')]);
});
after(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

for (const [suite, description] of [
  ['channel', 'Native updater accepts only valid GitHub channels and monotonic Android release tags'],
  ['redirects', 'API and APK downloads enforce their HTTPS host allowlists including each redirect'],
  ['integrity', 'APK size and SHA-256 must both match the release asset'],
  ['install', 'Only an exact same-signer, same-package upgrade matching the advertised version can install']
]) {
  test(description, () => {
    execFileSync(exe('java'), ['-cp', dir, 'pl.rozstaw.app.UpdatePolicyChecks', suite]);
  });
}
