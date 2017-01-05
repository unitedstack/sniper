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
  }
};
