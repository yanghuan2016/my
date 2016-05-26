/**
 *  处方单首页
 *
 */

var React = require('react');

var style = require('./recipeList.css');

var Table = require('basic/table/table.jsx');
var Icon = require('basic/icon/icon.jsx');
var Input = require('basic/input/input.jsx');
var SelectBasic = require('basic/select/select.jsx');
var patientListAction = require('action/patientListAction.js');
var productStore = require('stores/productStore.js');
import { Select } from 'antd';
var Option = Select.Option;

var recipeCreateList = React.createClass({

    getInitialState: function () {
        var self = this;
        return {
            productList: productStore.getProductList(),
            selectRecipeList: productStore.getSelectRecipeList(),
            columns: [
                {
                    title: '药品名称',
                    dataIndex: 'commonName',
                    key: 'commonName'
                }, {
                    title: '规格',
                    dataIndex: 'spec',
                    key: 'spec',
                    render: function (text, record) {
                        return text + '/' + record.measureUnit
                    }
                }, {
                    title: '一次数量',
                    dataIndex: 'dose',
                    key: 'dose',
                    render: function (text, record) {
                        return <Input type="text" name='dose'
                                      defaultValue={record.dose}
                                      keyId={record.unicode}
                                      onChange={self._inputOnchange}/>
                    }
                }, {
                    title: '频次',
                    dataIndex: 'dailyTimes',
                    key: 'dailyTimes',
                    render: function (text, record) {
                        return <Input type="text"
                                      name='dailyTimes'
                                      defaultValue={record.dailyTimes}
                                      keyId={record.unicode}
                                      onChange={self._inputOnchange}/>
                    }
                }, {
                    title: '用法',
                    dataIndex: 'takeMethods',
                    key: 'takeMethods',
                    render: function (text, record) {
                        return <Input type="text"
                                      name='takeMethods'
                                      defaultValue={record.takeMethods}
                                      keyId={record.unicode}
                                      onChange={self._inputOnchange}/>
                    }
                }, {
                    title: '天数',
                    dataIndex: 'medicationTime',
                    key: 'medicationTime',
                    render: function (text, record) {
                        return <Input type="text" name='medicationTime'
                                      defaultValue={record.medicationTime}
                                      keyId={record.unicode}
                                      onChange={self._inputOnchange}/>
                    }
                }, {
                    title: '取药的数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    render: function (text, record) {
                        return <Input type="text" name='quantity'
                                      defaultValue={record.quantity}
                                      keyId={record.unicode}
                                      onChange={self._inputOnchange}/>
                    }
                }, {
                    title: '单价',
                    dataIndex: 'price',
                    key: 'price',
                    render: (text) => ('¥' + Number(text).toFixed(2))
                }, {
                    title: '总价',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    render: (text) => (text > 0 ? ('¥' + Number(text).toFixed(2)) : '')
                }, {
                    title: '操作',
                    key: 'operation',
                    render: function (text, record) {
                        return <Icon name='trash'
                                     className={style.trash}
                                     keyId={record.unicode}
                                     onClick={self._deleteOneProduct}/>
                    }
                }
            ]
        }
    },

    _inputOnchange: function (key, value, keyId) {
        patientListAction.setTakeMethods(key, value, keyId);
    },

    _deleteOneProduct: function (unicode) {
        patientListAction.deleteOneProduct(unicode);
    },

    _onChange: function () {
        this.setState({
            productList: productStore.getProductList(),
            selectRecipeList: productStore.getSelectRecipeList()
        });
    },

    componentDidMount: function () {
        productStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        productStore.removeChangeListener(this._onChange);
    },

    _onSearch: function (value) {
        if (value) {
            patientListAction.searchProduct(value);
        } else {
            patientListAction.clearProduct();
        }
    },

    _onSelect: function (value) {
        var unicode = value.split(":")[1];
        patientListAction.addRecipeOne(unicode);
    },

    _footer: function () {
        var self = this;
        var product = self.state.productList;
        var children = [];
        for (var i = 0; i < product.length; i++) {
            children.push(<Option
                key={product[i].commonName + ":" + product[i].unicode.toString()}>{product[i].commonName}［{product[i].spec}/{product[i].measureUnit}］</Option>);
        }
        return <SelectBasic placeholder='请输入您想找的药品的名字'
                            notFoundContent='请输入您想找的药品的名字'
                            onSearch={self._onSearch}
                            onSelect={self._onSelect}
                            children={children}/>
    },

    render: function () {
        return (
            <div className={style.item + ' ' + 'antd-empty'}>
                <Table columns={this.state.columns}
                       bordered
                       dataSource={this.state.selectRecipeList}
                       footer={this._footer}/>
            </div>
        )
    }
});

module.exports = recipeCreateList;