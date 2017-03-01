let React = require('react');
let BasicProps = require('client/components/basic_props/index');
let ObjACL = require('../../../../components/obj_acl/index');
let MiniTable = require('client/components/detail_minitable/index');
let {Button} = require('client/uskin/index');
let addProject = require('../../pop/add_project/index');

let request = require('../../request');
let getTime = require('client/utils/time_unification');
let unitConverter = require('client/utils/unit_converter');

class ObjDesc extends React.Component {
  constructor(props) {
    super(props);
  }

  getBasicPropsItem(item) {
    let __ = this.props.__,
      size = unitConverter(item.Size);

    let items = [{
      title: __.name,
      content: item.id
    }, {
      title: __.size,
      content: (item.Size && size.num !== 0) ? (size.num + ' ' + size.unit) : '-'
    }, {
      title: __.update_time,
      content: item.LastModified ? getTime(item.LastModified.toString()) : '-'
    }];

    return items;
  }

  getTableConfig(item) {
    let props = this.props,
      __ = props.__,
      acl = props.acl,
      data = [];

    acl.Grants.forEach(g => {
      let grantee = g.Grantee;

      let ele = {
        key: grantee.ID ? grantee.ID : 'id',
        id: grantee.ID ? grantee.ID : '-',
        name: grantee.DisplayName ? grantee.DisplayName : '-',
        type: grantee.Type,
        permission: g.Permission
      };
      data.push(ele);
    });

    let tableConfig = {
      column: [{
        title: __.project_id,
        key: 'id',
        dataIndex: 'id'
      }, {
        title: __.project_name,
        key: 'name',
        dataIndex: 'name'
      }, {
        title: __.type,
        key: 'type',
        dataIndex: 'type'
      }, {
        title: __._permission,
        key: 'permission',
        dataIndex: 'permission'
      }],
      data: data,
      dataKey: 'key',
      hover: true
    };

    return tableConfig;
  }

  onChangeACL(key) {
    let props = this.props,
      bucket = props.bucket,
      obj = this.props.rawItem;
    let p = {
      Bucket: bucket,
      Key: obj.Key,
      ACL: key === 'public' ? 'public-read' : 'private'
    };

    request.putObjectAcl(p).then(() => {
      props.onUpdateDetail && props.onUpdateDetail(true);
    }).catch(err => {
      console.log(err);
    });
  }

  onAddProject(item, bucket) {
    let props = this.props;

    addProject({
      item: item,
      bucket: bucket,
      acl: props.acl
    }, null, props.onUpdateDetail);
  }

  render() {
    let props = this.props,
      __ = props.__,
      basicPropsItem = this.getBasicPropsItem(props.rawItem),
      tableConfig = this.getTableConfig(props.rawItem);

    return (
      <div>
        <BasicProps
          title={__.basic_properties}
          defaultUnfold={true}
          tabKey={'description'}
          rawItem={props.rawItem}
          items={basicPropsItem ? basicPropsItem : []} />
        <ObjACL
          defaultUnfold={true}
          tabKey={'description'}
          __={__}
          rawItem={props.rawItem}
          acl={props.acl}
          url={props.url}
          onAction={this.onChangeACL.bind(this)} />
        <MiniTable
          __={__}
          title={__.permission}
          defaultUnfold={true}
          tableConfig={tableConfig ? tableConfig : {}}>
          <Button value={__.add_project} disabled={false} onClick={this.onAddProject.bind(this, props.rawItem, props.bucket)} />
        </MiniTable>
      </div>
    );
  }
}

module.exports = ObjDesc;
