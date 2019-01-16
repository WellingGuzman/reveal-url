const url = require('url');

const DEFAULT_PROTOCOL = 'http';

const request = {
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

module.exports = function (requestedUrl) {
  return new Promise(function (resolve, reject) {
    const protocol = getProtocol(requestedUrl) || DEFAULT_PROTOCOL;

    requestedUrl = ensureUrl(requestedUrl);
    // use head?
    request[protocol].get(requestedUrl, function (response) {
      var err, result;

      if (isRedirection(response)) {
        result = getUrl(requestedUrl, response);
      } else {
        err = new Error('not found');
      }

      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }).on('error', err => reject(err));
  });
};