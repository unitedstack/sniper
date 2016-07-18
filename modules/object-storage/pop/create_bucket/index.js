var commonModal = require('client/components/modal_common/index');
var config = require('./config.json');
var __ = require('locale/client/s3.lang.json');
var request = require('../../request');

function pop(arr, parent, callback) {

  var props = {
    __: __,
    parent: parent,
    config: config,
    onConfirm: function(refs, cb) {
      var params = {
        Bucket: refs.name.state.value
      };

      request.createBucket(params).then((res) => {
        cb(true);
        callback && callback(res);
      }).catch((err) => {
        var msg = JSON.parse(err.response).message;
        cb(false, msg);
      });
    },
    onAction: function(field, state, refs) {}
  };

  commonModal(props);
}

module.exports = pop;
