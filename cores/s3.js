require('aws-sdk/dist/aws-sdk');
const fetch = require('./fetch');
const Promise = require('rsvp').Promise;

let S3 = null;

module.exports = function() {
  if (S3) {
    return Promise.resolve(S3);
  }

  return fetch.get({
    url: '/proxy/keystone/v3/users/' + HALO.user.userId + '/credentials/OS-EC2'
  }).then(function(creds) {
    //set credentials in AWS.config
    let credentials = creds.credentials;

    if(!credentials || credentials.length === 0) {
      return null;
    }

    let AWS = window.AWS;
    AWS.config.update({
      accessKeyId: credentials[0].access,
      secretAccessKey: credentials[0].secret
    });

    S3 = new AWS.S3({
      endpoint: 'http://eos.ustack.com:7480',
      s3ForcePathStyle: true
    });
    return S3;
  });
};
