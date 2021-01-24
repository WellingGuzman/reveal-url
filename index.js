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
  } else if (protocol !== 'http' && protocol !== 'https') {
    throw new Error('Unsupported protocol "' + protocol  + '". Only http/https supported');
  }

  return url;
}

function isRedirection(response) {
  if (response.statusCode < 300 || response.statusCode >= 400) {
    return false;
  }

  return response.headers.hasOwnProperty('location');
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

function fetch(url, urls) {
  if (!urls) {
    urls = [];
  }

  url = ensureUrl(url);
  urls.push(url);

  return new Promise(function (resolve, reject) {
    const protocol = getProtocol(url) || DEFAULT_PROTOCOL;

    clients[protocol].get(url, function (response) {
      const isRedirectResponse = isRedirection(response);
      const redirectUrl = isRedirectResponse ? getUrl(url, response) : null;

      if (isRedirectResponse && redirectUrl) {
        fetch(redirectUrl, urls).then(function (urls) {
          resolve(urls);
        }).catch(reject);
      } else {
        resolve(urls);
      }
    }).on('error', reject);
  });
}

function isSameUrl(urlA, urlB) {
  const protocolA = (getProtocol(urlA) || '');
  const protocolB = (getProtocol(urlB) || '');

  return urlA.slice(protocolA.length) === urlB.slice(protocolB.length);
}

// TODO: Remove this, not idea why we have the startsWith(https://) it should be any protocol
//       Plus, it should be if the url are not the same
function confirmHTTPSRedirection(redirectUrl, requestedUrl) {
  if (redirectUrl.startsWith('https://') && isSameUrl(redirectUrl, requestedUrl)) {
    return fetch(redirectUrl);
  }

  return Promise.resolve(redirectUrl);
}

module.exports = fetch;