const downloadFileWithLink = require("./downloadFileWithLink");

const handleDownload = async (chunks, deviceAuth, callback, updateCallback) => {
  const downloads = [];
  const results = [];

  chunks.forEach((chunk, index) => {
    const download = async () => {
      const data = await downloadFileWithLink(chunk.DownloadLink, chunk.encoding);

      results[index] = {
        ...chunk,
        size: chunk.size + data.length,
        data: data,
      };

      updateCallback(chunk.chunkType);
    };

    downloads.push(download());
  });

  await Promise.all(downloads);

  return results;
}

module.exports = handleDownload;
