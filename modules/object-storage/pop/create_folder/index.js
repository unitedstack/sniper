let commonModal = require('client/components/modal_common/index');
let config = require('./config.json');
let request = require('../../request');
let utils = require('../../../../utils/utils');
const __ = require('locale/client/storage.lang.json');

function pop(arr, parent, breadcrumb, callback) {
  let props = {
    __: __,
    parent: parent,
    config: config,
    onConfirm: function(refs, cb) {
      let params = {
        Bucket: breadcrumb[0],
        Key: utils.getURL(breadcrumb, refs.name.state.value)
      };

      request.putObject(params).then(res => {
        callback && callback(res);
        cb(true);
      }).catch(err => {
        cb(false, 'ERROR');
      });
    },
    onAction: function(field, state, refs) {
      switch(field) {
        case 'name':
          let tester = /\//,
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
