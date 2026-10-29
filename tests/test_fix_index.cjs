const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/fixIndex.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
let calls = 0, mode = 'pending', now = 0;
const timers = new Map(); let timerId = 0;
const sandbox = {window: {addEventListener: () => {}}, exports: {}, Map, Promise, Date: {now: () => now},
  setTimeout: fn => {timers.set(++timerId, fn); return timerId;},
  clearTimeout: id => timers.delete(id),
  require: path => path.includes('fixRuntime') ? {appDisplayName: () => 'Game'} : {checkFixes: () => {
    calls++;
    if (mode === 'pending') return new Promise(() => {});
    if (mode === 'error') return Promise.reject(new Error('offline'));
    return Promise.resolve({success:true, appid:1, gameName:'Game', genericFix:{available:true,status:200}, onlineFix:{available:false,status:404}});
  }}
};
vm.runInNewContext(js, sandbox);
(async () => {
  const check = sandbox.exports.checkFixesFull;
  const a = check(1), b = check(1);
  assert.strictEqual(a, b);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(calls, 1);
  for (const fn of [...timers.values()]) fn();
  assert.equal((await a).partialResults, true);
  mode = 'ok';
  assert.equal((await check(1)).genericFix.available, true);
  now = 16000;
  mode = 'error';
  const stale = await check(1);
  assert.equal(stale.partialResults, true);
  assert.equal(stale.genericFix.available, true);
  assert.equal(timers.size, 0);
  console.log('fixIndex: coalescing, timeout, retry, stale-result retention passed');
})().catch(e => {console.error(e); process.exitCode = 1;});
