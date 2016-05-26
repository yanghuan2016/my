/**
 * 商品配对
 *
 * @type {*|exports|module.exports}
 */

/*
 * login.jsx
 *
 * 2015-04-20    wzhongbi-romens     created
 *
 */

var React = require('react');
var Button = require('antd').Button;

var style = require('./right.css');

var SearchInput = require('ediComponents/basic/searchInput/searchInput');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var MatchingFailure = require('ediComponents/basic/matchingFailure/matchingFailure');

var productMatchAction = require('ediAction/productMatchAction');
var productMatchStore = require('ediStores/productMatchStore');

var productList = React.createClass({

    getInitialState: function () {
        var data = {
            filter: ''
        };
        productMatchAction.getCurrentProductListFromClouds(data);
        return {
            list: productMatchStore.getRightList(),
            page: 1
        }
    },

    _onChange: function () {
        this.setState({
            list: productMatchStore.getRightList()
        });
    },

    componentDidMount: function () {
        productMatchStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        productMatchStore.removeChangeListener(this._onChange);
    },

    _onCheckRadio: function (e) {
        var val = e.target.value;
        this.props.onClickRightChecked && this.props.onClickRightChecked(val);
    },

    _onInputChange: function (val) {
        var data = {
            filter: val
        };
        productMatchAction.getCurrentProductListFromClouds(data);
    },

    _getNextPage: function (val) {
        var page = ++this.state.page;
        this.setState({
            page: page
        });
        var data = {
            filter: val,
            type: this.props.tabsKey,
            page: page
        };
        productMatchAction.getCurrentProductList(data);
    },

    render: function () {
        var self = this;
        var list = this.state.list.map(function (item) {
            return (
                <li key={item.id}>
                    {self.props.tabsKey == '1' ?
                        <input type="radio" name='right' value={item.id} onChange={self._onCheckRadio}/> : ''}

                    <div className={style.productItem}>
                        <GoodsItem goodsDetail={item}/>
                    </div>
                </li>
            )
        });
        return (
            <div className={style.list + ' ' + "ant-transfer-list  product-list"}>
                <div className="ant-transfer-list-header">
                    <span className="ant-transfer-list-header-title">雨诺商品库</span>
                </div>
                <div className={"ant-transfer-list-body " + style.listBackgorund}>
                    {self.props.tabsKey == '1' ?
                        <div className="ant-transfer-list-body-search-wrapper">
                            <SearchInput className={style.searchInput}
                                         onInputChange={this._onInputChange}
                                         placeholder='请输入商品名称/生产厂家/货号/批准文号'/>
                        </div> : ""}
                    <div className={style.listBodyContent}>
                        {this.state.list.length > 0 ? <ul>{list}</ul> : <MatchingFailure />}
                        <div className="ant-transfer-list-footer">
                            <Button className={style.footButton} onClick={this._getNextPage}>下一页</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});
module.exports = productList;