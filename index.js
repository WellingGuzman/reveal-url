const parseUrl = require('url').parse;
const DEFAULT_PROTOCOL = 'http';
const clients = {
  https: require('https'),
  http: require('http'),
}

function getProtocol(url) {
  const parsedUrl = parseUrl(url);

  if (parsedUrl && parsedUrl.protocol) {
    return parsedUrl.protocol.slice(0, -1);
  }

  return null;
}

function ensureUrl(url) {
  const protocol = getProtocol(url);

  if (!protocol) {
    url = DEFAULT_PROTOCOL + '://' + url;
  }

  return url;
}

function isRedirection(response) {
  const isValidStatus = response.statusCode >= 300 && response.statusCode <= 399;
  const hasLocationHeader = response.headers.hasOwnProperty('location');

  return isValidStatus && hasLocationHeader;
}

function getUrl(url, response) {
  const redirectUrl = response.headers.location;
  const redirectUrlParsed = parseUrl(redirectUrl);

  if (redirectUrlParsed.hostname) {
    return redirectUrl;
  }

  const parsedUrl= parseUrl(url);

  return parsedUrl.protocol + '//' + parsedUrl.host + redirectUrl;
}

function fetch(url) {
  return new Promise(function (resolve, reject) {
    const protocol = getProtocol(url) || DEFAULT_PROTOCOL;

    url = ensureUrl(url);
    // use head?
    clients[protocol].get(url, function (response) {
      if (isRedirection(response)) {
        // Resolve only pass the fist parameter
        confirmHTTPSRedirection(getUrl(url, response), url)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('not found'));
      }
    }).on('error', err => reject(err));
  });
}

function isSameUrl(urlA, urlB) {
  const protocolA = (getProtocol(urlA) || '');
  const protocolB = (getProtocol(urlB) || '');

  return urlA.slice(protocolA.length) === urlB.slice(protocolB.length);
}

function confirmHTTPSRedirection(redirectUrl, requestedUrl) {
  if (redirectUrl.startsWith('https://') && isSameUrl(redirectUrl, requestedUrl)) {
    return fetch(redirectUrl);
  }

  return Promise.resolve(redirectUrl);
}

module.exports = function (url) {
  return fetch(url);
};