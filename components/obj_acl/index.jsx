require('../../style/index.less');
require('./style/index.less');

let React = require('react');

class ObjACL extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      toggle: false,
      publicChecked: false
    };

    this.toggle = this.toggle.bind(this);
  }

  componentWillMount() {
    let props = this.props,
      isAclPublic = props.acl.Grants.some(ele => {
        if(ele.Grantee.Type === 'Group') {
          return true;
        }
        return false;
      });

    this.setState({
      loading: this.props.url ? true : false,
      toggle: this.props.defaultUnfold,
      publicChecked: isAclPublic
    });
  }

  toggle(e) {
    this.setState({
      toggle: !this.state.toggle
    });
  }

  onAction(actionType, data) {
    this.props.onAction && this.props.onAction(this.props.tabKey, actionType, data);
  }

  onChangeSelect(key) {
    let props = this.props;
    this.setState({
      publicChecked: key === 'public' ? true : false
    });

    props.onAction && props.onAction(key);
  }

  render() {
    let props = this.props,
      state = this.state,
      __ = props.__;

    return (
      <div className="toggle">
        <div className="toggle-title" onClick={this.toggle}>
          {__.share_url}
          <i className={'glyphicon icon-arrow-' + (state.toggle ? 'up' : 'down')} />
        </div>
        <div className={'toggle-content' + (state.toggle ? ' unfold' : ' fold')}>
          <div className="halo-com-share-url">
            <div className="public-switch">
              <input type="radio" checked={!state.publicChecked} onChange={this.onChangeSelect.bind(this, 'private')} />
              <span>{__.private}</span>
              <input type="radio" checked={state.publicChecked} onChange={this.onChangeSelect.bind(this, 'public')} />
              <span>{__.public}</span>
            </div>
             <div className="url">URL :{state.publicChecked ? <a href={props.url}>{props.url}</a> : ''}</div>
          </div>
        </div>
      </div>
    );
  }

}

module.exports = ObjACL;
