require('./style/index.less');

var React = require('react');
var {Tab, Button} = require('client/uskin/index');
let MiniTable = require('client/components/detail_minitable/index');
let converter = require('../../utils/lang_converter');
let request = require('../../modules/object-storage/request');

var config = require('./config.json');

class Model extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      config: config,
      keys: []
    };
  }

  componentWillMount() {
    converter.convertLang(this.props.__, config);
    this.onInitialize();
  }

  onInitialize() {
    request.getKeys().then(res => {
      this.setState({
        keys: res.credentials
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    document.getElementsByClassName('settings-detail')[0].style.display = 'block';
    document.getElementById('main-wrapper').removeChild(document.getElementsByClassName('settings-detail')[1]);
  }

  onClose() {
    document.getElementById('main').style.display = 'block';
    document.getElementsByClassName('settings-detail')[0].style.display = 'none';
    document.getElementsByClassName('scroll-pane')[0].style.display = 'block';
    var li = document.getElementsByClassName('menu')[0].getElementsByTagName('li');
    for(var i = 0; i < li.length; i++) {
      li[i].style.display = 'block';
    }
    var haloMenu = document.getElementsByClassName('halo-com-menu')[0],
      menu = document.getElementsByClassName('menu')[0];
    ['maxWidth', 'width', 'minWidth'].forEach(m => {
      haloMenu.style[m] = '296px';
      menu.style[m] = '215px';
    });
  }

  getTableConfig() {
    let props = this.props,
      state = this.state,
      __ = props.__;

    state.keys.forEach(ele => {
      ele.operation = <i className="glyphicon icon-remove"
        onClick={this.onClickRemove.bind(this, ele)} />;
    });

    let tableConfig = {
      column: [{
        title: 'Access Key',
        key: 'access',
        dataIndex: 'access'
      }, {
        title: 'Secret Access Key',
        key: 'secret',
        dataIndex: 'secret'
      }, {
        title: __.operation,
        key: 'operation',
        dataIndex: 'operation'
      }],
      data: state.keys,
      dataKey: 'access',
      hover: true
    };

    return tableConfig;
  }

  onCreateKey() {
    request.createKey().then(res => {
      this.onInitialize();
    });
  }

  onClickRemove(item) {
    request.removeKey(item).then(res => {
      this.onInitialize();
    });
  }

  render() {
    let state = this.state,
      props = this.props,
      _config = state.config,
      tabs = _config.tabs,
      __ = props.__;
    let tableConfig = this.getTableConfig();

    return (
      <div className="halo-module-storage-key" style={this.props.style}>
        <div className="settings-close">
          <i className="glyphicon icon-close" onClick={this.onClose.bind(this)} />
        </div>
        <div className="settings-content">
          {tabs ?
            <div className="submenu-tabs">
              <Tab items={tabs}/>
            </div>
            : null
          }
          <MiniTable
            __={__}
            title={__.auth_mgmt}
            defaultUnfold={true}
            tableConfig={tableConfig ? tableConfig : {}}>
            <Button value={__.create_key} disabled={false} onClick={this.onCreateKey.bind(this)} />
          </MiniTable>
        </div>
      </div>
    );
  }

}

module.exports = Model;
