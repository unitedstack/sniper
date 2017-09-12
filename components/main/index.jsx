require('./style/index.less');

const React = require('react');
const {InputSearch, Tab, Table, Breadcrumb} = require('client/uskin/index');
const ButtonList = require('./button_list');
const Detail = require('./detail');
const moment = require('client/libs/moment');
const router = require('client/utils/router');
const getTime = require('client/utils/time_unification');
const converter = require('../../utils/lang_converter');

class Main extends React.Component {
  constructor(props) {
    super(props);

    moment.locale(HALO.configs.lang);

    this.state = {
      detailVisible: props.showDetail
    };

    this.stores = {
      rows: []
    };

    this.initialized = false;
  }

  componentWillMount() {
    let config = this.props.config;
    let dataKey = config.table.dataKey;

    config.table.column.forEach((col) => {
      if (col.filter) {
        col.filterAll = ['all'];
      }
      if (col.sort) {
        col.sortBy = function(item1, item2) {
          let key = col.dataIndex,
            a = item1[key] ? item1[key] : '(' + item1[dataKey] + ')',
            b = item2[key] ? item2[key] : '(' + item2[dataKey] + ')';

          return a.localeCompare(b);
        };
      }
    });
    converter.convertLang(this.props.__, config);
    this.tableColRender(config.table.column);
  }

  tableColRender(columns) {
    columns.map((column) => {
      switch (column.type) {
        case 'status':
          column.render = (col, item, i) => {
            return this.props.getStatusIcon(item[col.dataIndex]);
          };
          break;
        case 'time':
          column.render = (col, item, i) => {
            return getTime(item[col.dataIndex], true);
          };
          break;
        default:
          break;
      }
    });
  }

  onAction(field, actionType, data) {
    if (!data) {
      data = {};
    }
    data.rows = this.stores.rows;
    let func = this.props.onAction;
    func && func(field, actionType, this.refs, data);
  }

  componentDidMount() {
    this.props.onInitialize(this.props.params);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.initialized) {
      this.onChangeParams(nextProps.params);
    } else {
      if (nextProps.visible) {
        if (!this.props.visible) {
          this.clearState();
        }
        if (this.props.params !== nextProps.params) {
          this.onChangeParams(nextProps.params);
        }
      }
    }

    this.updateRows(nextProps.config.table.data);

    this.initialized = true;

    this.setState({
      detailVisible: nextProps.showDetail
    });
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.visible) {
      return true;
    }
    return false;
  }

  updateRows(data) {
    //update main store rows
    let newRows = [];
    let key = this.props.config.table.dataKey;

    this.stores.rows.forEach((item) => {
      let existed = data.filter((d) => d[key] === item[key])[0];

      if (existed) {
        newRows.push(existed);
      }
    });

    this.stores.rows = newRows;

    //update table checkedKey
    let checkedKey = {};
    newRows.forEach((item) => {
      checkedKey[item[key]] = true;
    });

    let table = this.refs.table;
    if (table) {
      table.check(checkedKey);
    }

    //update btn status
    this.onAction('table', 'check', {
      status: false,
      checkedRow: this.stores.rows
    });
  }

  updateDetailClose() {
    this.setState({
      detailVisible: false
    });

    this.onAction('detail', 'update_close');
  }

  onChangeParams(params) {
    let table = this.refs.table,
      detail = this.refs.detail;

    if(params === 2) {
      this.stores = {
        rows: []
      };

      if (detail && detail.state.visible) {
        detail.setState({
          visible: false
        });
      }

      if (table) {
        table.check({});
      }
    }

    this.onAction('table', 'check', {
      status: params[2] ? true : false,
      checkedRow: params[2] ? this.stores.rows[0] : null
    });

  }

  searchInTable(text) {
    let table = this.refs.table;

    if (table) {
      let search = this.props.config.search,
        filterCol = search.column;

      if (search && search.column) {
        if (text) {
          //close detail when search start
          let params = this.props.params;
          if (params.length > 2) {
            router.pushState('/' + params.slice(0, 2).join('/'));
          }

          //arguments: filter columns, filter function
          table.filter(filterCol, function(item, column) {
            let ret = column.some((col) => {
              if (filterCol[col.key] && item[col.dataIndex]) {
                let td = item[col.dataIndex].toLowerCase();
                return td.indexOf(text.toLowerCase()) > -1 ? true : false;
              }
            });

            return ret;
          });
        } else {
          table.filter(filterCol, undefined);
        }
      }
    }
  }

  changeSearchInput(str) {
    this.searchInTable(str);

    this.onAction('searchInput', 'search', {
      text: str
    });
  }

  checkboxListener(status, clickedRow, arr) {
    if (arr.length <= 0 || arr.length > 1) {
      this.refs.detail.setState({
        visible: false
      });
      this.updateDetailClose();
    }
  }

  onChangeTableCheckbox(status, clickedRow, rows) {
    this.stores = {
      rows: rows
    };
    let detail = this.refs.detail;

    if (detail && detail.state.visible) {
      this.checkboxListener(status, clickedRow, rows);
    }

    this.onAction('table', 'check', {
      status: status,
      clickedRow: clickedRow
    });
  }

  onClickDetailTabs(tab) {
    this.onAction('detail', tab ? tab.key : this.refs.detail.findDefaultTab().key, {});
  }

  onClickBreadcrumb(data) {
    this.onAction('breadcrumb', null, data);
  }

  clearState() {
    this.stores.rows = [];
    this.onAction('table', 'check', {
      status: false,
      clickedRow: []
    });

    this.clearSearchState();
    this.clearTableState();
  }

  clearSearchState() {
    if (this.refs.search) {
      this.refs.search.clearState();
      this.searchInTable(undefined);
    }
  }

  clearTableState() {
    if (this.refs.table) {
      this.refs.table.clearState();
    }
  }

  render() {
    let _config = this.props.config,
      state = this.state,
      stores = this.stores,
      tabs = _config.tabs,
      title = _config.tabs.filter((tab) => tab.default)[0].name,
      breadcrumb = _config.breadcrumb,
      btns = _config.btns,
      search = _config.search,
      table = _config.table,
      detail = _config.table.detail,
      __ = this.props.__;

    return (
      <div className="halo-com-main">
        {tabs ?
          <div className="submenu-tabs">
            <Tab items={tabs} />
          </div> : null
        }
        {breadcrumb ?
          <div className="page-breadcrumb">
            <Breadcrumb items={breadcrumb} onClick={this.onClickBreadcrumb.bind(this)} />
          </div> : null
        }
        <div className="operation-list">
          <ButtonList
            ref="btnList"
            btns={btns}
            onAction={this.onAction.bind(this)} />
          {search ?
            <InputSearch
              ref="search"
              type="light"
              width={search.width}
              onChange={this.changeSearchInput.bind(this)} />
            : null
          }
        </div>
        <div className="table-box">
          {!table.loading && !table.data.length ?
            <div className="table-with-no-data">
              <Table
                column={table.column}
                data={[]}
                checkbox={table.checkbox} />
              <p>
                {__.there_is_no + title + __.full_stop}
              </p>
            </div>
          : <Table
              ref="table"
              column={table.column}
              data={table.data}
              dataKey={table.dataKey}
              loading={table.loading}
              checkbox={table.checkbox}
              checkboxOnChange={this.onChangeTableCheckbox.bind(this)}
              hover={table.hover}
              striped={this.striped} />
          }
          {detail ?
            <Detail
              ref="detail"
              tabs={detail.tabs}
              rows={stores.rows}
              visible={state.detailVisible}
              onClickTabs={this.onClickDetailTabs.bind(this)}
              updateDetailClose={this.updateDetailClose.bind(this)} />
            : null
          }
        </div>
      </div>
    );
  }
}

module.exports = Main;
