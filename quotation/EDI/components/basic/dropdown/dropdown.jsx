/**
 * 基础下拉框
 * @type {*|exports|module.exports}
 */

var React = require('react');
import { Menu, Dropdown } from 'antd';
const DropdownButton = Dropdown.Button;

var DropDown = React.createClass({

    _handleMenuClick: function (e) {
        this.props.menuClick(e.key);
    },

    render: function () {
        var listData = this.props.listData;
        var dropDownListValue = this.props.dropDownListValue;
        var status = '';
        var list = _.map(listData, function (item) {
            if (item.key == dropDownListValue) {
                status = item.status;
            }
            return <Menu.Item key={item.key}>{item.status}</Menu.Item>;
        });
        var menu = (
            <Menu onClick={this._handleMenuClick}>
                {list}
            </Menu>
        );

        return (
            <DropdownButton overlay={menu} type="primary">
                {status}
            </DropdownButton>
        );
    }
});

module.exports = DropDown;