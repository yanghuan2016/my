/**
 * Pagination(页面分页显示)
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Style = require('./pagination.css');
var Paginate = require('antd').Pagination;

var Pagination = React.createClass({

    getInitialState: function () {
        return {
            defaultCurrent: 1,
            total: 100
        }
    },

    _onPagination: function (value) {
        this.props.onChange(value);
    },

    render: function () {
        return (
            <Paginate className={Style.pagination}
                      onChange={this._onPagination}
                      defaultCurrent={this.state.defaultCurrent}
                      total={this.state.total}/>
        )
    }
});

module.exports = Pagination;