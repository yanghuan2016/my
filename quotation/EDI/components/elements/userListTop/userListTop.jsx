/**
 *
 */

var React = require('react');
var Row = require('antd').Row;
var Col = require('antd').Col;
var style = require('./userListTop.css');
var DropDown = require('ediComponents/basic/dropdown/dropdown.jsx');
var SearchInput = require('ediComponents/basic/searchInput/searchInput');

module.exports = React.createClass({

    getInitialState: function () {
        return {
            dropDownListValue: -1
        };
    },

    _onInputChange: function (value) {
        this.props.onSearch('keyWords', value);
    },

    _onSearch: function (value) {
        this.props.onSearch('keyWords', value);
    },

    _menuClick: function (key) {
        this.setState({
            dropDownListValue: key
        });
        this.props.onSearch('status', key);
    },

    render: function () {
        var dropList = [
            {
                key: -1,
                status: '全部',
                value: -1
            },
            {
                key: 0,
                status: '未匹配',
                value: 0
            },
            {
                key: 1,
                status: "已匹配",
                value: 1
            }
        ];
        var self = this;
        return (
            <Row className={style.item}>
                <Col span='5'>
                    <Col span='6'>
                        <h3>{self.props.title}</h3>
                    </Col>
                    <Col span='9'>
                        总计：{self.props.total}
                    </Col>
                    <Col span='9'>
                        未匹配：{self.props.failed}
                    </Col>
                </Col>
                <Col span='19' className={style.operation}>
                    <DropDown listData={dropList}
                              dropDownListValue={self.state.dropDownListValue}
                              menuClick={this._menuClick}/>
                    <SearchInput placeholder={self.props.placeholder}
                                 onSearch={this._onSearch}
                                 onInputChange={this._onInputChange}
                                 className={style.searchInput}/>
                </Col>
            </Row>
        )
    }
});