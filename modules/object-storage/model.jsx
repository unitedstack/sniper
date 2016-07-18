require('./style/index.less');

var React = require('react');
var Main = require('../../components/main/index');
var BasicProps = require('client/components/basic_props/index');

//pops
var createBucket = require('./pop/create_bucket/index.js');

var __ = require('locale/client/s3.lang.json');
var config = require('./config.json');
var getStatusIcon = require('../../utils/status_icon');
var moment = require('client/libs/moment');
var request = require('./request');
var router = require('client/utils/router');
var getTime = require('client/utils/time_unification');
var unitConverter = require('client/utils/unit_converter');

class Model extends React.Component {

  constructor(props) {
    super(props);

    moment.locale(HALO.configs.lang);

    this.state = {
      config: config
    };

    ['onInitialize', 'onAction'].forEach((m) => {
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
    columns.map((column) => {
      switch (column.key) {
        case 'name':
          column.render = (col, item, i) => {
            if(item.Name) {
              return <a onClick={this.onClickFolder.bind(this, item)}>{item.Name}</a>;
            } else if(item.Key) {
              if(/\/$/.test(item.Key)) {
                return <a onClick={this.onClickFolder.bind(this, item)}>{item.name ? item.name.slice(0, -1) : item.Key.slice(0, -1)}</a>;
              } else {
                return item.name ? item.name : item.Key;
              }
            }
          };
          break;
        case 'time':
          column.render = (col, item, i) => {
            if(item.CreationDate) {
              return getTime(item.CreationDate, true);
            } else if (item.LastModified) {
              return getTime(item.LastModified, true);
            } else {
              return '-';
            }
          };
          break;
        case 'resource_size':
          column.render = (col, item, i) => {
            var s = unitConverter(item.Size);
            return s.num === 0 ? '-' : s.num + ' ' + s.unit;
          };
          break;
        default:
          break;
      }
    });
  }

  onInitialize(params) {
    this.getTableData(false);
  }

  getTableData() {
    request.getList().then((res) => {
      var table = this.state.config.table;
      table.data = res;
      table.loading = false;

      var detail = this.refs.dashboard.refs.detail;
      if (detail && detail.state.loading) {
        detail.setState({
          loading: false
        });
      }

      this.setState({
        config: config
      }, () => {
        var detailVisible = detail.state.visible;
        if (detail && detailVisible) {
          detail.refresh();
        }
      });
    });
  }

  onAction(field, actionType, refs, data) {
    switch (field) {
      case 'btnList':
        this.onClickBtnList(data.key, refs, data);
        break;
      case 'table':
        this.onClickTable(actionType, refs, data);
        break;
      case 'detail':
        this.onClickDetailTabs(actionType, refs, data);
        break;
      default:
        break;
    }
  }

  onClickFolder(item) {
    //when click bucket, change btns
    if(config.btns[0].key === 'crt_bucket') {
      config.btns = [{
        value: __.upload,
        key: 'upload',
        type: 'create',
        icon: 'upload'
      }, {
        value: __.create + __.folder,
        key: 'crt_folder',
        icon: 'create'
      }, {
        value: __.download,
        key: 'download',
        icon: 'download',
        disabled: true
      }, {
        value: __.more,
        key: 'more',
        iconClass: 'more',
        dropdown: {
          items: [{
            items: [{
              title: __.copy,
              key: 'copy',
              disabled: true
            }, {
              title: __.paste,
              key: 'paste',
              disabled: true
            }, {
              title: __.attribute,
              key: 'attribute',
              disabled: true
            }]
          }, {
            items: [{
              title: __.delete,
              key: 'delete',
              danger: true,
              disabled: true
            }]
          }]
        }
      }];

      config.table.column = [{
        title: __.name,
        key: 'name',
        sort: true
      }, {
        title: __.size,
        key: 'resource_size'
      }, {
        title: __.update + __.time,
        key: 'time'
      }];
    }

    this.tableColRender(this.state.config.table.column);
    this.loadingTable();
    this.refs.dashboard.clearState();

    //when click bucket, request bucket objects
    var table = this.state.config.table;
    if(item.Name) {
      config.breadcrumb.push({
        name: item.Name
      });

      var params = {
        Bucket: item.Name
      };
      request.getBucketResource(params).then((res) => {
        config.table.dataKey = 'Key';

        //get first layer resources under bucket
        var tarRes = res.filter(r => {
          var layerNum = r.Key.split('/').length;
          if(layerNum === 1 || (layerNum === 2 && /\/$/.test(r.Key))) {
            return true;
          } else {
            return false;
          }
        });

        table.data = tarRes;
        table.loading = false;

        this.refs.dashboard.setState({
          resources: res
        });
      });
    } else {
      var layerArray = item.Key.split('/'),
        len = layerArray.length;
      config.breadcrumb.push({
        name: layerArray[len - 2]
      });

      //when click folders, get data from state
      var currentLayerItems = this.getFolderResource(item.Key, this.refs.dashboard.state.resources);
      table.data = currentLayerItems;
      table.loading = false;
    }
  }

  getFolderResource(currentLayer, data) {
    var layerHead = new RegExp('^' + currentLayer);
    var layerTail = new RegExp(currentLayer + '$');

    //get data under folder currentLayer
    var tarData = data.filter(item => {
      if(layerTail.test(item.Key) || !layerHead.test(item.Key)) {
        return false;
      }
      item.name = item.Key.slice(currentLayer.length);
      return true;
    });

    return tarData;
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

  onClickBtnList(key, refs, data) {
    switch (key) {
      case 'create_bucket':
        createBucket();
        break;
      case 'refresh':
        this.refresh({
          tableLoading: true,
          detailLoading: true,
          clearState: true,
          detailRefresh: true
        }, true);
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
    for (let key in btns) {
      switch (key) {
        default:
          break;
      }
    }

    return btns;
  }

  onClickDetailTabs(tabKey, refs, data) {
    var {rows} = data;
    var detail = refs.detail;
    var contents = detail.state.contents;
    var syncUpdate = true;

    var isAvailableView = (_rows) => {
      if (_rows.length > 1) {
        contents[tabKey] = (
          <div className="no-data-desc">
            <p>{__.view_is_unavailable}</p>
          </div>
        );
        return false;
      } else {
        return true;
      }
    };

    switch (tabKey) {
      case 'description':
        if (isAvailableView(rows)) {
          var basicPropsItem = this.getBasicPropsItems(rows[0]);

          contents[tabKey] = (
            <div>
              <BasicProps
                title={__.basic + __.properties}
                defaultUnfold={true}
                tabKey={'description'}
                items={basicPropsItem}
                rawItem={rows[0]}
                onAction={this.onDetailAction.bind(this)}
                dashboard={this.refs.dashboard ? this.refs.dashboard : null} />
            </div>
          );
        }
        break;
      default:
        break;
    }

    if (syncUpdate) {
      detail.setState({
        contents: contents,
        loading: false
      });
    }
  }

  getBasicPropsItems(item) {
    var items = [{
      title: __.name,
      content: item.name
    }, {
      title: __.id,
      content: item.InstanceId
    }];

    return items;
  }

  refresh(data, forceUpdate) {
    if (data) {
      var path = router.getPathList();
      if (path[2]) {
        if (data.detailLoading) {
          this.refs.dashboard.refs.detail.loading();
        }
      } else {
        if (data.tableLoading) {
          this.loadingTable();
        }
        if (data.clearState) {
          this.refs.dashboard.clearState();
        }
      }
    }

    this.getTableData(forceUpdate, data ? data.detailRefresh : false);
  }

  loadingTable() {
    var _config = this.state.config;
    _config.table.loading = true;

    this.setState({
      config: _config
    });
  }

  onDetailAction(tabKey, actionType, data) {
    switch (tabKey) {
      case 'description':
        this.onDescriptionAction(actionType, data);
        break;
      default:
        break;
    }
  }

  onDescriptionAction(actionType, data) {
    switch (actionType) {
      default:
        break;
    }
  }

  render() {
    return (
      <div className="halo-module-object-storage" style={this.props.style}>
        <Main
          ref="dashboard"
          visible={this.props.style.display === 'none' ? false : true}
          onInitialize={this.onInitialize}
          onAction={this.onAction}
          config={this.state.config}
          params={this.props.params}
          getStatusIcon={getStatusIcon}
          __={__}
        />
      </div>
    );
  }
}

module.exports = Model;
