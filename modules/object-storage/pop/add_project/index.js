let commonModal = require('client/components/modal_common/index');
let config = require('./config.json');
let request = require('../../request');
const __ = require('locale/client/storage.lang.json');

function pop(obj, parent, callback) {
  let props = {
    __: __,
    parent: parent,
    config: config,
    onConfirm: function(refs, cb) {
      let item = obj.item,
        acl = obj.acl;

      let grants = acl.Grants;
      grants.push({
        Grantee: {
          Type: 'CanonicalUser',
          ID: refs.project_id.state.value
        },
        Permission: 'READ'
      });
      let params = {
        Bucket: obj.bucket,
        Key: item.Key,
        AccessControlPolicy: {
          Grants: grants,
          Owner: {
            ID: acl.Owner.ID
          }
        }
      };

      request.putObjectAcl(params).then(res => {
        callback && callback(true);
        cb(true);
      }).catch(err => {
        cb(false, 'ERROR');
        refs.btn.setState({
          disabled: true
        });
      });
    },
    onAction: function(field, state, refs) {
      refs.btn.setState({
        disabled: !refs.project_id.state.value
      });
    }
  };

  commonModal(props);
}

module.exports = pop;
