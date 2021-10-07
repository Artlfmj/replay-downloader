const needle = require('needle');
const fs = require('fs');

const {
  authClientId,
  authClientSecret,
  timeUntilNextCheck,
  tokenEndpoint,
  verifyEndpoint,
} = require('../constants');
const UnsuccessfulRequestException = require('./UnsuccessfulRequestException');

const options = {
  auth: 'basic',
  username: authClientId,
  password: authClientSecret,
};

const body = {
  grant_type: 'device_auth',
  token_type: 'eg1',
};

const lastTokenCheck = {};

const checkToken = async (token) => {
  if (lastTokenCheck[token] < Date.now() + (timeUntilNextCheck * 1000)) {
    return true;
  }

  const { statusCode } = await needle(verifyEndpoint, {
    method: 'post',
    headers: {
      Authorization: token,
    },
  });

  const isValid = statusCode === 200;

  if (!isValid) {
    delete lastTokenCheck[token];
  } else {
    lastTokenCheck[token] = Date.now();
  }

  return isValid;
};

const getCachedToken = async (auths, cache) => {
  const cachedData = cache[auths.account_id];

  if (!cachedData) {
    return null;
  }

  const isExpired = new Date(cachedData.expires_at).getTime() <= Date.now();

  if (isExpired) {
    return null;
  }

  const isTokenValid = await checkToken(`${cachedData.token_type} ${cachedData.access_token}`);

  if (!isTokenValid) {
    return null;
  }

  return {
    token: `${cachedData.token_type} ${cachedData.access_token}`,
    tokenInfo: cachedData,
  };
};

const fetchToken = async (auths, theCache) => {
  const cache = theCache;

  const { body: tokenData, statusCode } = await needle('post', tokenEndpoint, {
    ...body,
    ...auths,
  }, options);

  if (statusCode !== 200 || tokenData.error) {
    throw new UnsuccessfulRequestException(statusCode, tokenData);
  }

  cache[tokenData.account_id] = tokenData;

  fs.writeFileSync(`${module.path}/../cache.json`, JSON.stringify(cache));

  return {
    token: `${tokenData.token_type} ${tokenData.access_token}`,
    tokenInfo: tokenData,
  };
};

const getAccessToken = async (auths) => {
  let cache = {};

  if (fs.existsSync(`${module.path}/../cache.json`)) {
    cache = JSON.parse(fs.readFileSync(`${module.path}/../cache.json`));

    const cachedToken = await getCachedToken(auths, cache);

    if (cachedToken) {
      return cachedToken;
    }
  }

  return fetchToken(auths, cache);
};

module.exports = getAccessToken;
