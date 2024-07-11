const { workerData } = require('node:worker_threads');

if (workerData.fullpath.endsWith('.ts')) {
  require('ts-node').register();
}
module.exports = require(workerData.fullpath);
