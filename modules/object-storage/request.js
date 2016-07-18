var fetch = require('../../cores/fetch');

module.exports = {
  getList: function(forced) {
    return fetch.put({
      url: '/aws/exec',
      data: {
        method: 'listBuckets',
        module: 'S3'
      }
    }).then((data) => {
      return data.Buckets;
    });
  },
  createBucket: function(params) {
    return fetch.put({
      url: '/aws/exec',
      data: {
        method: 'createBucket',
        module: 'S3',
        params: params
      }
    });
  },
  getBucketResource: function(params) {
    return fetch.put({
      url: '/aws/exec',
      data: {
        method: 'listObjectsV2',
        module: 'S3',
        params: params
      }
    }).then((data) => {
      return data.Contents;
    });
  }
};
