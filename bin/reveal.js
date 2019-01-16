#!/usr/bin/env node

const reveal = require('..');
const args = process.argv.slice(2);

if (args.length == 0) {
    console.error('Usage: reveal.js <url>');
    process.exit(-1);
}

reveal(args[0])
    .then(console.log)
    .catch(err => console.log(err.message));