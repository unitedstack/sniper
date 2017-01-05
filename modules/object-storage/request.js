let getS3 = require('../../cores/s3');
let fetch = require('client/applications/dashboard/cores/fetch');
const RSVP = require('rsvp');

//define S3 request function
let request = {};
['listBuckets', 'listObjects', 'createBucket',
  'deleteBucket', 'putObject', 'deleteObject',
  'copyObject', 'getObjectUrl', 'putObjectAcl',
  'getObjectAcl'].forEach((m) => {
    request[m] = function(params, options) {
      return getS3().then(S3 => {
        return new Promise(function(resolve, reject) {
          if(m === 'getObjectUrl') {
            resolve(S3.getSignedUrl('getObject', params));
          } else {
            S3[m](params, (err, data) => {
              if(err) {
                reject(err);
              }
              resolve(data);
            });
          }
        });
      });
    };
  });

//add data processing
let finalRequest = {
  listBuckets: function() {
    return request.listBuckets().then(res => {
      let buckets = res.Buckets;
      buckets.forEach(b => {
        b.id = b.Name;
        b.type = 'bucket';
      });

      return buckets;
    });
  },
  listObjects: function(params) {
    return request.listObjects(params).then(res => {
      let objs = res.Contents;
      objs.forEach(obj => {
        obj.id = obj.Key;
        obj.key = obj.Key;
        obj.type = (obj.Size === 0) ? 'folder' : 'object';
      });

      return objs;
    });
  },
  putObjects: function(objs) {
    let deferredList = [];
    objs.forEach((params) => {
      deferredList.push(request.putObject(params));
    });
    return RSVP.all(deferredList);
  },
  listBucketObjects: function(params) {
    return this.listObjects(params).then(res => {
      let objs = res.filter(ele => {
        if(ele.Key.match(/\//)) {
          return false;
        }
        return true;
      });

      return objs;
    });
  },
  listFolderObjects: function(params, folder) {
    return this.listObjects(params).then(res => {
      res.forEach(ele => {
        ele.key = ele.Key.slice(params.Prefix.length);
      });

      return res;
    });
  },
  getKeys: function() {
    return fetch.get({
      url: '/proxy/keystone/v3/users/' + HALO.user.userId + '/credentials/OS-EC2'
    });
  },
  createKey: function() {
    return fetch.post({
      url: '/proxy/keystone/v3/users/' + HALO.user.userId + '/credentials/OS-EC2',
      data: {
        tenant_id: HALO.user.projectId
      }
    });
  },
  removeKey: function(item) {
    return fetch.delete({
      url: '/proxy/keystone/v3/users/' + HALO.user.userId + '/credentials/OS-EC2/' + item.access
    });
  }
};

module.exports = (function() {
  for(let r in request) {
    if(!finalRequest[r]) {
      finalRequest[r] = request[r];
    }
  }

  return finalRequest;
})();
