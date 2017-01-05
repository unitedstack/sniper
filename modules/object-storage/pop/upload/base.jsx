let React = require('react');
let {Modal, Button} = require('client/uskin/index');
let unitConverter = require('client/utils/unit_converter');
let request = require('../../request');
let utils = require('../../../../utils/utils');
const __ = require('locale/client/storage.lang.json');

class ModalBase extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: true,
      visible: true,
      files: []
    };

    ['onConfirm'].forEach(f => {
      this[f] = this[f].bind(this);
    });
  }

  componentWillMount() {
    document.addEventListener('dragover', function(e) {
      e.stopPropagation();
      e.preventDefault();
    }, false);
    document.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
    }, false);
  }

  componentWillUpdate(nextProps, nextState) {
    let showAddBtn = nextState.files.length < 5;
    let btnAdd = document.getElementsByClassName('add-btn')[0];
    btnAdd.style.display = showAddBtn ? 'block' : 'none';
  }

  componentDidMount() {
    let that = this,
      files = this.state.files;

    let dragBox = document.getElementsByClassName('drag-box')[0];
    dragBox.addEventListener('dragover', function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }, false);

    dragBox.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();

      let newFiles = e.dataTransfer.files;
      for(let i = 0; i < newFiles.length; i++) {
        let f = newFiles[i];
        f.id = f.name + Date.now();
        if(files.length < 5) {
          files.push(f);
        }
      }

      that.setState({
        files: files,
        disabled: files.length > 0 ? false : true
      });
    }, false);
  }

  onClickAdd() {
    let inputFile = document.getElementById('file-select');
    inputFile.click();
  }

  onClickRemove(item) {
    let files = this.state.files;
    let newFiles = files.filter(ele => {
      if(ele.id === item.id) {
        return false;
      }
      return true;
    });

    this.setState({
      files: newFiles,
      disabled: newFiles.length > 0 ? false : true
    });
  }

  fileUpload() {
    let files = this.state.files;
    let newFiles = this.refs.fileselect.files;
    for(let i = 0; i < newFiles.length; i++) {
      let f = newFiles[i];
      f.id = f.name + Date.now();
      files.push(f);
    }

    this.setState({
      files: files,
      disabled: files.length > 0 ? false : true
    });
  }

  onConfirm() {
    let props = this.props,
      breadcrumb = props.breadcrumb;
    let state = this.state;

    this.setState({
      disabled: true
    });

    let objs = [];
    state.files.forEach((f) => {
      objs.push({
        Bucket: breadcrumb[0],
        Key: utils.getURL(breadcrumb, f.name),
        Body: f
      });
    });

    request.putObjects(objs).then(res => {
      props.callback && props.callback(res);
      this.setState({
        visible: false
      });
    }).catch(err => {
      let msg = JSON.parse(err.response).message;
      console.log(msg);
    });
  }

  render() {
    let props = this.props,
      state = this.state,
      breadcrumb = '';
    if(props.breadcrumb.length === 1) {
      breadcrumb = ' > ' + props.breadcrumb[0];
    } else if (props.breadcrumb.length > 1) {
      breadcrumb = ' > ' + props.breadcrumb.join(' > ');
    }
    return (
      <Modal ref="modal" {...props} title={__.upload_file} visible={state.visible} width={700}>
        <div className="modal-bd halo-com-modal-upload-file">
          <div>{__.upload_to + ':'}<span>{__.all_bucket + breadcrumb}</span></div>
          <div className="upload-tip">{__.tip_upload_limitation}</div>
          <div className="drag-box">{__.tip_dragbox}</div>
          <ul>
            {state.files.length > 0 ? state.files.map(f => {
              let size = unitConverter(f.size);
              return (
                <li key={f.id} className="file-item">
                  <i className="glyphicon icon-file"/>
                  <span>{f.name + ' (' + size.num + ' ' + size.unit + ')'}</span>
                  <i className="glyphicon icon-remove" onClick={this.onClickRemove.bind(this, f)}/>
                </li>
              );
            }) : null}
          </ul>
          <div className="add-btn" onClick={this.onClickAdd}>
            <i className="glyphicon icon-create"/>
            <span>{__.add_file}</span>
            <input ref="fileselect" type="file" multiple id="file-select" onChange={this.fileUpload.bind(this)}/>
          </div>
        </div>
        <div className="modal-ft halo-com-modal-upload-file">
          <Button value={__.upload} disabled={state.disabled} type="create" onClick={this.onConfirm} />
        </div>
      </Modal>
    );
  }
}

module.exports = ModalBase;
