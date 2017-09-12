/**
 * @func: get status icon in table and details
 */
const React = require('react');
const __ = require('locale/client/storage.lang.json');

module.exports = (str) => {
  let status = str.toLowerCase();
  let type = {};

  switch(status) {
    case 'running':
      type.icon = 'active';
      type.status = 'active';
      break;
    default:
      type.status = 'loading';
      break;
  }

  let className = type.status === 'loading' ? 'glyphicon icon-loading status-loading'
    : 'glyphicon icon-status-' + type.icon + ' ' + type.status;

  return (
    <span className="status-data">
      <i className={className} />
      {__[status] ? __[status] : status}
    </span>
  );
};
