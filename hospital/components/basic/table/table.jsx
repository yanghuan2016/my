/**state
 * table组件
 * 封装ant design
 * props:(同ant design 的table)
 *        dataSource
 *        columns
 * added by hzh 2016-05-12
 */
var React = require('react');
var AntTable = require('antd').Table;

var Table = React.createClass({
    render: function () {
        return (
            <AntTable {...this.props} pagination={false}/>
        )
    }
});

module.exports = Table;