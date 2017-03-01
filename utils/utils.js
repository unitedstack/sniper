let moment = require('client/libs/moment');

module.exports = {
  getURL: function(breadcrumb, objKey) {
    let url = '',
      folders = breadcrumb.slice(1);

    if(breadcrumb.length > 1) {
      url = objKey ? (folders.join('/') + '/' + objKey) : folders.join('/');
    } else {
      url = objKey ? objKey : '';
    }

    return url;
  },
  getDate: function(time, fromNow) {
    if(typeof time === 'object' && fromNow) {
      return moment(new Date(time)).fromNow();
    }
  }
};
