#!/usr/bin/env node

const reveal = require('..');
const args = process.argv.slice(2);

function revealUrl(url) {
  if (!url) {
    console.error('Missing URL');
    process.exit(-1);
  }

  reveal(url)
    .then(console.log)
    .catch(console.error);
}

function getUrl() {
  return new Promise(function (resolve, reject) {
    if (args.length >= 1) {
      resolve(args[0]);
    } else {
      getUrlFromStdIn().then(resolve).catch(reject);
    }
  });
}

function getUrlFromStdIn() {
  return new Promise(function (resolve, reject) {
    var data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function (chunk) {
      data += chunk;
    });

    process.stdin.on('end', function () {
      resolve(data);
    });

    process.stdin.on('error', reject);

    process.openStdin();
  });
}

getUrl()
  .then(revealUrl)
  .catch(console.error);