let request = require('../../request');
let utils = require('../../../../utils/utils');

module.exports = function pasteObj(source, breadcrumb, callback) {
  let params = {
    Bucket: breadcrumb[0],
    Key: utils.getURL(breadcrumb, source.sourceName),
    CopySource: source.sourceURL
  };

  request.copyObject(params).then(res => {
    callback && callback(res);
  }).catch(err => {
    console.log(err);
  });
};
