# Reveal URL

This is an experiment out of curiosity to reveal the url from URL shorteners.

## Usage

```js
const reveal = require('.');

reveal('https://bit.ly/1Auq9db')
    .then(console.log)
    .catch(console.error);

reveal('https://qz.com/1523284')
    .then(console.log)
    .catch(console.error);
```