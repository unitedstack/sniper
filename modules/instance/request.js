import fetch from '../../cores/fetch';

module.exports = {
  getList: function(forced) {
    return fetch.put({
      url: '/aws/exec',
      data: {
        method: 'describeInstances',
        module: 'EC2'
      }
    }).then((data) => {
      return data.Reservations.map((instance) => {
        var obj = instance.Instances[0];
        var tags = obj.Tags;
        tags.some((tag) => {
          if (tag.Key === 'Name') {
            obj.name = tag.Value;
            return true;
          }
          return false;
        });
        return obj;
      });
    });
  }
};
