const url = require('url');

const DEFAULT_PROTOCOL = 'http';

const clients = {
  https: require('https'),
  http: require('http'),
}

function getProtocol(requestedUrl) {
  const parsedUrl = url.parse(requestedUrl);

  if (parsedUrl && parsedUrl.protocol) {
    return parsedUrl.protocol.slice(0, -1);
  }

  return null;
}

function ensureUrl(requestedUrl) {
  const protocol = getProtocol(requestedUrl);

  if (!protocol) {
    requestedUrl = DEFAULT_PROTOCOL + '://' + requestedUrl;
  }

  return requestedUrl;
}

function isRedirection(response) {
  const isValidStatus = response.statusCode >= 300 && response.statusCode <= 399;
  const hasLocationHeader = response.headers.hasOwnProperty('location');

  return isValidStatus && hasLocationHeader;
}

function getUrl(requestedUrl, response) {
  const redirectUrl = response.headers.location;
  const redirectUrlParsed = url.parse(redirectUrl);

  if (redirectUrlParsed.hostname) {
    return redirectUrl;
  }

  const requestedUrlParsed = url.parse(requestedUrl);

  return requestedUrlParsed.protocol + '//' + requestedUrlParsed.host + redirectUrl;
}

function fetch(requestedUrl) {
  return new Promise(function (resolve, reject) {
    const protocol = getProtocol(requestedUrl) || DEFAULT_PROTOCOL;

    requestedUrl = ensureUrl(requestedUrl);
    // use head?
    clients[protocol].get(requestedUrl, function (response) {
      if (isRedirection(response)) {
        // Resolve only pass the fist parameter
        confirmHTTPSRedirection(getUrl(requestedUrl, response), requestedUrl)
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

function confirmHTTPSRedirection(nextUrl, requestedUrl) {
  if (nextUrl.startsWith('https://') && isSameUrl(nextUrl, requestedUrl)) {
    return fetch(nextUrl);
  }

  return Promise.resolve(nextUrl);
}

module.exports = function (requestedUrl) {
  return fetch(requestedUrl);
};