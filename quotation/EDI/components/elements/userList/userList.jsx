/**
 * 我的客户页面
 *
 */

var React = require('react');
var style = require('./userList.css');

var Table = require('ediComponents/basic/table/table.jsx');
var Icon = require('ediComponents/basic/icon/icon.jsx');
var Pagination = require('ediComponents/basic/pagination/pagination');

module.exports = React.createClass({

    getInitialState: function () {
        return {
            columns: [
                {
                    title: '企业名称',
                    dataIndex: 'enterpriseName',
                    key: 'enterpriseName',
                    render: function (text, record) {
                        var name = 'exclamation-circle';
                        var className = style.orange;
                        if (record.enabled == '1') {
                            name = 'check-circle';
                            className = style.green;
                        }
                        return (
                            <div className={style.item}>
                                <Icon name={name} className={className}/>
                                <span>{text}</span>
                            </div>
                        )
                    }
                }, {
                    title: '平台唯一编码',
                    dataIndex: 'erpCode',
                    key: 'erpCode'
                }, {
                    title: '法人',
                    dataIndex: 'legalRepresentative',
                    key: 'legalRepresentative'
                }, {
                    title: '入驻时间',
                    dataIndex: 'createdOn',
                    key: 'createdOn',
                    render: function (text, record) {
                        var name = '未入驻';
                        var className = style.orange;
                        if (record.enabled == '1') {
                            name = moment(text).format('YYYY-MM-DD');
                            className = style.green;
                        }
                        return <span className={className}>{name}</span>
                    }
                }, {
                    title: '状态',
                    dataIndex: 'enabled',
                    key: 'enabled',
                    render: function (text, record) {
                        var name = '未匹配';
                        var className = style.orange;
                        if (record.enabled == '1') {
                            name = '已匹配';
                            className = style.green;
                        }
                        return <span className={className}>{name}</span>
                    }
                }
            ]
        }
    },

    _onPagination: function (value) {
        this.props.onPagination(value);
    },

    render: function () {
        var self = this;
        return (
            <div>
                <div className={style.table}>
                    <Table columns={self.state.columns}
                           className="table-font-size"
                           dataSource={self.props.dataSource}/>
                </div>
                <Pagination onChange={this._onPagination}/>
            </div>
        )
    }
});