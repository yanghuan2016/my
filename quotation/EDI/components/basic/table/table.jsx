/**
 * 基于 antd 的表格
 */

var React = require('react');
var Table = require('antd').Table;
var Tables = React.createClass({

    render: function () {
        return (
            <Table {...this.props} pagination={false}/>
        );
    }
});

module.exports = Tables;