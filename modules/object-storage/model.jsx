require('./style/index.less');

let React = require('react');
let Main = require('../../components/main/index');
let {Modal} = require('client/uskin/index');

//detail
let BucketDesc = require('./detail/bucket_desc/index');
let ObjDesc = require('./detail/obj_desc/index');

//pops
let deleteModal = require('client/components/modal_delete/index');
let createBucket = require('./pop/create_bucket/index');
let createFolder = require('./pop/create_folder/index');
let uploadObj = require('./pop/upload/index');
let downloadObj = require('./pop/download/index');
let pasteObj = require('./pop/paste/index');

let config = require('./config.json');
let bucketConfig = require('./bucket_config.json');
let objConfig = require('./obj_config.json');

let __ = require('locale/client/storage.lang.json');
let utils = require('../../utils/utils');
let getStatusIcon = require('../../utils/status_icon');
let converter = require('../../utils/lang_converter');
let moment = require('client/libs/moment');
let request = require('./request');
let unitConverter = require('client/utils/unit_converter');

class Model extends React.Component {

  constructor(props) {
    super(props);

    moment.locale(HALO.configs.lang);

    this.state = {
      config: config,
      breadcrumb: [],
      clipboard: null,
      showDetail: false
    };

    ['onInitialize', 'onAction', 'onClickBucket',
      'onClickBreadcrumb'].forEach((m) => {
        this[m] = this[m].bind(this);
      });
  }

  componentWillMount() {
    this.tableColRender(this.state.config.table.column);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.style.display === 'none' && !nextState.config.table.loading) {
      return false;
    }
    return true;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.style.display !== 'none' && this.props.style.display === 'none') {
      this.loadingTable();
      this.getTableData();
    }
  }

  tableColRender(columns) {
    let renderName = function(col, item, i) {
      switch(item.type) {
        case 'bucket':
          return <a onClick={this.updatePage.bind(this, 'clickBucket', item)}>{item.Name}</a>;
        case 'object':
          return item.key;
        case 'folder':
          return <a onClick={this.updatePage.bind(this, 'clickFolder', item)}>{item.key}</a>;
        default:
          break;
      }
    };

    columns.map((column) => {
      switch (column.key) {
        case 'name':
          column.render = renderName.bind(this);
          break;
        case 'time':
          column.render = (col, item, i) => {
            if(item.CreationDate) {
              return utils.getDate(item.CreationDate, true);
            } else if (item.LastModified) {
              return utils.getDate(item.LastModified, true);
            } else {
              return '-';
            }
          };
          break;
        case 'resource_size':
          column.render = (col, item, i) => {
            if(item.Size) {
              var s = unitConverter(item.Size);
              return s.num === 0 ? '-' : s.num + ' ' + s.unit;
            } else {
              return '-';
            }
          };
          break;
        default:
          break;
      }
    });
  }

  onInitialize(params) {
    let that = this;
    that.getTableData(false);
  }

  getTableData(detailRefresh) {
    let state = this.state,
      table = state.config.table;

    switch(config.breadcrumb.length) {
      case 1:
        table.column[2].title = __.create_time;
        request.listBuckets().then(res => {
          table.data = res;
          state.config.btns[0].disabled = false;
          state.config.btns[3].disabled = false;
          table.loading = false;

          let detail = this.refs.dashboard.refs.detail;
          if (detail && detail.state.loading) {
            detail.setState({
              loading: false
            });
          }

          this.setState({
            config: config
          }, () => {
            if (detail && detailRefresh) {
              detail.refresh();
            }
          });
        }).catch(err => {
          table.loading = false;
          this.setState({
            config: config
          });
        });
        break;
      case 2:
        this.loadingTable();
        request.listBucketObjects({
          Bucket: state.breadcrumb[0]
        }).then(res => {
          table.data = res;
          table.loading = false;

          this.setState({
            config: config
          });
        });
        break;
      default:
        this.onClickFolder();
        break;
    }
  }

  onAction(field, actionType, refs, data, isUpdateDetail) {
    switch (field) {
      case 'btnList':
        this.onClickBtnList(data.key, refs, data, this.state);
        break;
      case 'table':
        this.onClickTable(actionType, refs, data);
        break;
      case 'detail':
        this.onClickDetailTabs(actionType, refs, data, isUpdateDetail);
        break;
      case 'breadcrumb':
        this.onClickBreadcrumb(data);
        break;
      default:
        break;
    }
  }

  onClickBreadcrumb(item) {
    this.setState({
      showDetail: false
    });

    //convert lang first time using bucketConfig
    if(bucketConfig.btns[0].value === 'create_bucket') {
      converter.convertLang(__, bucketConfig);
    }

    switch(item.type) {
      case 'all':
        //change breadcrumb and btns
        config.breadcrumb = config.breadcrumb.slice(0, 1);
        config.btns = bucketConfig.btns;
        this.setState({
          breadcrumb: []
        });

        //update table data
        this.refresh({
          tableLoading: true,
          detailLoading: true,
          clearState: true,
          detailRefresh: true
        });
        break;
      case 'bucket':
        config.breadcrumb = config.breadcrumb.slice(0, 1);
        this.setState({
          breadcrumb: []
        });

        this.onClickBucket(item);
        break;
      case 'folder':
        let len = config.breadcrumb.indexOf(item);
        config.breadcrumb = config.breadcrumb.slice(0, len + 1);
        let newB = this.state.breadcrumb.slice(0, len);
        this.setState({
          breadcrumb: newB
        });
        this.onClickFolder(item, newB);
        break;
      default:
        break;
    }
  }

  updatePage(actionType, item) {
    switch(actionType) {
      case 'clickBucket':
        this.onClickBucket(item);
        break;
      case 'clickFolder':
        this.onClickFolder(item);
        break;
      default:
        break;
    }
  }

  onClickBucket(item) {
    this.refs.dashboard.clearState();
    this.setState({
      showDetail: false
    });

    //check necessity of changing btn list
    if(config.btns[0].key === 'crt_bucket') {
      if(objConfig.btns[0].value === 'upload') {
        converter.convertLang(__, objConfig);
      }
      config.btns = objConfig.btns;
      this.state.config.table.column[2].title = __.update_time;
    }

    //add new element to breadcrumb
    config.breadcrumb.push({
      name: item.Name ? item.Name : item.name,
      type: item.type ? item.type : ''
    });
    this.setState({
      breadcrumb: item.Name ? [item.Name] : [item.name]
    });

    //update data
    this.loadingTable();
    request.listBucketObjects({
      Bucket: item.Name ? item.Name : item.name
    }).then(res => {
      let table = this.state.config.table;
      table.data = res;
      table.loading = false;

      this.setState({
        config: config
      });
    });
  }

  onClickFolder(item, newBreadcrumb) {
    this.setState({
      showDetail: false
    });

    let b = this.state.breadcrumb;
    //add new element to breadcrumb
    if(item && item.key) {
      config.breadcrumb.push({
        name: item.key,
        type: item.type ? item.type : ''
      });
      b.push(item.key);
      this.setState({
        breadcrumb: b
      });
    }

    //update data
    this.loadingTable();
    let p = {
      Bucket: b[0],
      Delimiter: '/',
      Prefix: utils.getURL(b) + '/'
    };
    if(newBreadcrumb) {
      p.Prefix = utils.getURL(newBreadcrumb) + '/';
    }
    request.listFolderObjects(p).then(res => {
      config.table.data = res;
      this.state.config.table.loading = false;

      this.setState({
        config: config
      });
    });
  }

  onClickTable(actionType, refs, data) {
    switch (actionType) {
      case 'check':
        this.onClickTableCheckbox(refs, data);
        break;
      default:
        break;
    }
  }

  onClickBtnList(key, refs, data, state) {
    let rows = data.rows,
      that = this,
      breadcrumb = state.breadcrumb;

    switch (key) {
      case 'crt_bucket':
        createBucket(null, null, function() {
          that.refresh({
            detailRefresh: true
          });
        });
        break;
      case 'crt_folder':
        createFolder(null, null, breadcrumb, () => {
          that.refresh({
            detailRefresh: true
          });
        });
        break;
      case 'upload':
        uploadObj(null, null, breadcrumb, () => {
          that.refresh({
            detailRefresh: true
          });
        });
        break;
      case 'download':
        downloadObj(rows[0], breadcrumb);
        break;
      case 'copy':
        let source = {
          sourceName: rows[0].key,
          sourceURL: breadcrumb[0] + '/' + utils.getURL(breadcrumb, encodeURIComponent(rows[0].key))
        };
        this.setState({
          clipboard: source
        });
        break;
      case 'paste':
        pasteObj(state.clipboard, state.breadcrumb, () => {
          this.setState({
            clipboard: null
          });

          this.refresh({
            detailRefresh: true
          });
        });
        break;
      case 'delete_bucket':
        request.listBucketObjects({
          Bucket: rows[0].Name
        }).then(res => {
          if(res.length === 0) {
            rows[0].name = rows[0].Name;
            deleteModal({
              __: __,
              action: 'delete',
              type: 'bucket',
              data: rows,
              onDelete: function(_data, cb) {
                request.deleteBucket({
                  Bucket: rows[0].Name
                }).then(() => {
                  cb(true);
                  that.refresh({
                    detailRefresh: true
                  });
                });
              }
            });
          } else {
            let props = {
              title: __.tip,
              content: __.tip_delete_warning.replace('{0}', __.bucket),
              okText: __.confirm
            };
            Modal.warning(props);
          }
        });
        break;
      case 'delete':
        let p = {
          Bucket: breadcrumb[0],
          Delimiter: '/',
          Prefix: utils.getURL(breadcrumb, rows[0].key) + '/'
        };
        request.listFolderObjects(p).then(res => {
          if(res.length === 0) {
            rows[0].name = rows[0].key;
            deleteModal({
              __: __,
              action: 'delete',
              type: 'object',
              data: rows,
              onDelete: function(_data, cb) {
                request.deleteObject({
                  Bucket: that.state.breadcrumb[0],
                  Key: rows[0].Key
                }).then(() => {
                  cb(true);
                  that.refresh({
                    detailRefresh: true
                  });
                });
              }
            });
          } else {
            let props = {
              title: __.tip,
              content: __.tip_delete_warning.replace('{0}', __.folder),
              okText: __.confirm
            };
            Modal.warning(props);
          }
        });
        break;
      case 'attribute':
        this.onClickAttribute(refs, data);
        break;
      case 'refresh':
        this.refresh({
          tableLoading: true,
          detailLoading: true,
          clearState: true,
          detailRefresh: true
        });
        break;
      default:
        break;
    }
  }

  onClickTableCheckbox(refs, data) {
    var {rows} = data,
      btnList = refs.btnList,
      btns = btnList.state.btns;

    btnList.setState({
      btns: this.btnListRender(rows, btns)
    });

  }

  btnListRender(rows, btns) {
    let state = this.state;

    for (let key in btns) {
      switch (key) {
        case 'delete_bucket':
          btns[key].disabled = (rows.length === 1) ? false : true;
          break;
        case 'download':
          btns[key].disabled = (rows.length === 1 && rows[0].Size > 0) ? false : true;
          break;
        case 'copy':
          btns[key].disabled = (rows.length === 1 && rows[0].Size > 0) ? false : true;
          break;
        case 'paste':
          btns[key].disabled = state.clipboard ? false : true;
          break;
        case 'attribute':
          btns[key].disabled = (rows.length === 1 && rows[0].type !== 'folder') ? false : true;
          break;
        case 'delete':
          btns[key].disabled = (rows.length === 1) ? false : true;
          break;
        default:
          break;
      }
    }

    return btns;
  }

  onClickAttribute(refs, data) {
    this.setState({
      showDetail: !this.state.showDetail
    });

    if(data.rows[0].type === 'bucket') {
      this.onAction('detail', 'bucket_desc', refs, data);
    } else {
      this.onAction('detail', 'obj_desc', refs, data);
    }
  }

  onClickDetailTabs(tabKey, refs, data, isUpdate) {
    let {rows} = data;
    let detail = refs.detail,
      state = this.state,
      contents = detail.state.contents;

    if(!isUpdate) {
      detail.setState({
        loading: true
      });
    }

    let contentSync = function() {
      detail.setState({
        contents: contents,
        loading: false
      });
    };

    switch (tabKey) {
      case 'update_close':
        this.setState({
          showDetail: false
        });
        break;
      case 'bucket_desc':
        contents.description = (
          <BucketDesc
            __={__}
            rawItem={rows[0]} />
        );
        contentSync();
        break;
      case 'obj_desc':
        let p = {
          Bucket: state.breadcrumb[0],
          Key: rows[0].Key
        };
        let url = '';
        request.getObjectAcl(p).then(request.getObjectUrl(p).then(res => {
          url = res;
        })).then(acl => {
          contents.description = (
            <ObjDesc
              __={__}
              acl={acl}
              url={url.split('?')[0]}
              bucket={state.breadcrumb[0]}
              rawItem={rows[0]}
              onUpdateDetail={this.onAction.bind(this, 'detail', tabKey, refs, data)} />
          );
          contentSync();
        });
        break;
      default:
        break;
    }
  }

  refresh(data) {
    let refs = this.refs;
      // detail = refs.dashboard.refs.detail;

    if (data) {
      // if (detail.state.visible) {
      //   if (data.detailLoading) {
      //     detail.loading();
      //   }
      // } else {
      if (data.tableLoading) {
        this.loadingTable();
      }
      if (data.clearState) {
        this.setState({
          showDetail: false
        });
        refs.dashboard.clearState();
      }
      // }
    }

    this.getTableData(data ? data.detailRefresh : false);
  }

  loadingTable() {
    var _config = this.state.config;
    _config.table.loading = true;

    this.setState({
      config: _config
    });
  }

  render() {
    let state = this.state,
      props = this.props;

    return (
      <div className="halo-module-object-storage" style={this.props.style}>
        <Main
          ref="dashboard"
          visible={props.style.display === 'none' ? false : true}
          onInitialize={this.onInitialize}
          onAction={this.onAction}
          config={state.config}
          params={props.params}
          showDetail={state.showDetail}
          getStatusIcon={getStatusIcon}
          __={__} />
      </div>
    );
  }
}

module.exports = Model;
