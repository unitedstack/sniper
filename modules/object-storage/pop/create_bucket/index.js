const commonModal = require('client/components/modal_common/index');
const config = require('./config.json');
const request = require('../../request');
const __ = require('locale/client/storage.lang.json');

function pop(arr, parent, callback) {
  let props = {
    __: __,
    parent: parent,
    config: config,
    onConfirm: function(refs, cb) {
      request.listBuckets().then(buckets => {
        let bucketExist = buckets.some(b => {
          return (b.Name === refs.name.state.value);
        });

        if(bucketExist) {//check in case bucket name has been used
          cb(false, __.name_conflict);
          refs.btn.setState({
            disabled: true
          });
        } else {
          let params = {
            Bucket: refs.name.state.value
          };

          request.createBucket(params).then((res) => {
            cb(true);
            callback && callback(res);
          }).catch((err) => {
            cb(false, 'ERROR');
          });
        }
      });
    },
    onAction: function(field, state, refs) {
      switch(field) {
        case 'name':
          let tester = /^\.|\//,
            error = tester.test(refs.name.state.value);
          refs.name.setState({
            error: error || !refs.name.state.value
          });
          break;
        default:
          break;
      }

      refs.btn.setState({
        disabled: refs.name.state.error
      });
    }
  };

  commonModal(props);
}

module.exports = pop;
