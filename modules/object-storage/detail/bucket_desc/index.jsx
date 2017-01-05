let React = require('react');
let BasicProps = require('client/components/basic_props/index');
let getTime = require('client/utils/time_unification');
let unitConverter = require('client/utils/unit_converter');

class BucketDesc extends React.Component {
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
      title: __.create_time,
      content: item.CreationDate ? getTime(item.CreationDate.toString()) : '-'
    }];

    return items;
  }

  render() {
    let props = this.props,
      __ = props.__,
      basicPropsItem = this.getBasicPropsItem(props.rawItem);

    return (
      <div>
        <BasicProps
          title={__.basic_properties}
          defaultUnfold={true}
          tabKey={'description'}
          rawItem={props.rawItem}
          items={basicPropsItem} />
      </div>
    );
  }
}

module.exports = BucketDesc;
