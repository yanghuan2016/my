/**
 * 商品配对
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Button = require('antd').Button;

var style = require('./left.css');

var SearchInput = require('ediComponents/basic/searchInput/searchInput');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var MatchingFailure = require('ediComponents/basic/matchingFailure/matchingFailure');

var productMatchAction = require('ediAction/productMatchAction');
var productMatchStore = require('ediStores/productMatchStore');

var productList = React.createClass({

    getInitialState: function () {
        var data = {
            filter: '',
            type: this.props.tabsKey
        };
        productMatchAction.getCurrentProductList(data);
        return {
            list: productMatchStore.getLeftList(),
            page: 1
        }
    },

    _onChange: function () {
        this.setState({
            list: productMatchStore.getLeftList()
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
        this.props.onClickLeftChecked && this.props.onClickLeftChecked(val);
    },

    _onInputChange: function (val) {
        var data = {
            filter: val,
            type: this.props.tabsKey
        };
        productMatchAction.getCurrentProductList(data);
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
                    <input type="radio" name='left' value={item.id} onChange={self._onCheckRadio}/>

                    <div className={style.productItem}>
                        <GoodsItem goodsDetail={item}/>
                    </div>
                </li>
            )
        });

        return (
            <div className={style.list + ' ' + "ant-transfer-list  product-list"}>
                <div className="ant-transfer-list-header">
                    <span className="ant-transfer-list-header-title">我的商品库</span>
                </div>
                <div className={"ant-transfer-list-body " + style.listBackgorund}>
                    <div className="ant-transfer-list-body-search-wrapper">
                        <SearchInput className={style.searchInput}
                                     onInputChange={this._onInputChange}
                                     placeholder='请输入商品名称/生产厂家/货号/批准文号'/>
                    </div>
                    <div className={style.listBodyContent}>
                        {this.state.list.length > 0 ? <ul>{list}</ul> :
                            <MatchingFailure content1='没找到相关商品' content2=''/>}
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