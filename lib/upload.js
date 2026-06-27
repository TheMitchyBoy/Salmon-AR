'use strict';

const fs = require('fs');
const path = require('path');

function streamBodyToFile(req, destPath, limit) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    let size = 0;
    let failed = false;
    const out = fs.createWriteStream(destPath);

    const cleanup = (err) => {
      if (failed) return;
      failed = true;
      out.destroy();
      fs.unlink(destPath, () => reject(err));
    };

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        cleanup(new Error(`Upload too large (max ${Math.round(limit / (1024 * 1024))} MB)`));
        req.destroy();
      }
    });

    req.on('error', cleanup);
    out.on('error', cleanup);
    out.on('finish', () => {
      if (!failed) resolve(size);
    });

    req.pipe(out);
  });
}

module.exports = { streamBodyToFile };
