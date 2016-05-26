var React = require('react');
import { Select } from 'antd';
var Option = Select.Option;

var select = React.createClass({

    getDefaultProps: function () {
        return {
            multiple: true, /*　是否可以多选　默认多选*/
            children: []
        }
    },

    _handleSearch: function (value) {
        this.props.onSearch(value);
    },

    _onSelect: function (value) {
        this.props.onSelect(value);
    },

    render: function () {
        return (
            <Select multiple={this.props.multiple}
                    style={{ width: '100%', height: 'auto' }}
                    placeholder={this.props.placeholder}
                    onSelect={this._onSelect}
                    notFoundContent={this.props.notFoundContent}
                    onSearch={this._handleSearch}>
                {this.props.children}
            </Select>
        );
    }

});

module.exports = select;