let request = require('../../request');

module.exports = function downloadObj(obj, breadcrumb, callback) {
  let params = {
    Bucket: breadcrumb[0],
    Key: obj.Key,
    ResponseContentDisposition: 'attachment;filename=' + obj.key
  };

  request.getObjectUrl(params).then(res => {
    let linkNode = document.createElement('a');
    linkNode.href = res;
    linkNode.click();
    linkNode = null;

    callback && callback(res);
  }).catch(err => {
    console.log(err);
  });
};
