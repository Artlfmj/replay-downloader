const request = require("request");
const getAccessToken = require("./getAccessToken");

const getDownloadLink = (link, deviceAuth, callback) => {
  getAccessToken(deviceAuth, (accessToken) => {
    request(link, {
      headers: {
        Authorization: accessToken,
        'User-Agent': 'Tournament replay downloader',
      }
    }, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        callback(false, err || body);

        return;
      }

      callback(JSON.parse(body).files);
    });
  });
};

module.exports = getDownloadLink;
