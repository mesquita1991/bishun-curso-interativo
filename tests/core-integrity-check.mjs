import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.cwd());
const expectedBlobs = {
  'app.js': '80addaeda970dad4f41ef1d4d04e3dea40b3c35f',
  'course.js': 'b9b0405458d4c405b55a5caf3a090779f08de664',
  'curriculum-data.js': 'f1b633c353e16b60b49d779ac0f8ea9ccce50ea3',
  'full-course.js': '2daf912b32dc628c4f36b648abbaf13ee590155a',
  'post-standard.js': '1439dc0dfa46a04bbf9597940ea0ba082a8102f7',
  'mastery-v6.js': '86d373377a5dfce39e3cce835300f8ae28eb7a2d'
};
const expectedDataTree = 'f894df48393976e623f645b6e97796facfccfff8';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const gitObjectSha = (type, payload) => crypto.createHash('sha1').update(Buffer.from(`${type} ${payload.length}\0`)).update(payload).digest('hex');
const blobSha = file => { const data = fs.readFileSync(file); return gitObjectSha('blob', data); };

function treeSha(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => Buffer.from(a.name).compare(Buffer.from(b.name)));
  const chunks = entries.map(entry => {
    const full = path.join(dir, entry.name);
    const isDir = entry.isDirectory();
    const mode = isDir ? '40000' : '100644';
    const sha = isDir ? treeSha(full) : blobSha(full);
    return Buffer.concat([Buffer.from(`${mode} ${entry.name}\0`), Buffer.from(sha, 'hex')]);
  });
  return gitObjectSha('tree', Buffer.concat(chunks));
}

for (const [file, expected] of Object.entries(expectedBlobs)) {
  const actual = blobSha(path.join(root, file));
  assert(actual === expected, `Core protegido alterado: ${file} (${actual} != ${expected})`);
}
const actualDataTree = treeSha(path.join(root, 'data'));
assert(actualDataTree === expectedDataTree, `Diretório data/ alterado (${actualDataTree} != ${expectedDataTree})`);
console.log(JSON.stringify({ ok: true, protectedCoreFiles: Object.keys(expectedBlobs).length, dataTree: actualDataTree }, null, 2));
