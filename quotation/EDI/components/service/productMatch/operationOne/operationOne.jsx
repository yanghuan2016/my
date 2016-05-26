/**
 * 商品配对
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Modal = require('antd').Modal;
var Button = require('antd').Button;

var style = require('./operationOne.css');
var productMatchStore = require('ediStores/productMatchStore');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');

var operationOne = React.createClass({

    getInitialState: function () {
        return {
            visibleOne: false,
            visibleTwo: false
        };
    },

    _showModalOne: function () {
        this.setState({
            visibleOne: true
        });
    },

    _showModalTwo: function () {
        this.setState({
            visibleTwo: true
        });
    },

    _handleCancelOne: function () {
        this.setState({
            visibleOne: false
        });
    },

    _handleOkOne: function () {
        alert("您点击了配对按钮, 您正在提交的商品ＩＤ,leftChecked = " + this.props.leftChecked + ",rightChecked = " + this.props.rightChecked);
    },

    _handleCancelTwo: function () {
        this.setState({
            visibleTwo: false
        });
    },

    _handleOkTwo: function () {
        alert("您点击了提交按钮, 您正在提交的商品ＩＤ　＝　" + this.props.leftChecked);
    },


    render: function () {
        var self = this;
        var list = "";

        var productOne = productMatchStore.getLeftListOne(this.props.leftChecked);
        var uploadClouds = productMatchStore.getLeftListOne(this.props.leftChecked);
        var productTwo = productMatchStore.getRightListOne(this.props.rightChecked);

        if (self.props.leftChecked && self.props.rightChecked) {
            list =
                <div>
                    <Button type="primary" size="large" onClick={self._showModalOne}>配对</Button>
                    <Modal title="确认配对以下商品吗?"
                           visible={self.state.visibleOne}
                           closable={false}
                           maskClosable={true}
                           okText='确认'
                           width='670'
                           cancelText='取消'
                           onOk={self._handleOkOne}
                           onCancel={self._handleCancelOne}>
                        <div className={style.modalOneDivsion}>
                            <GoodsItem goodsDetail={productOne}/>
                            <GoodsItem goodsDetail={productTwo}/>
                        </div>
                    </Modal>
                    <Button size="large" disabled>取消配对</Button>
                    <Button type="primary" size="large" onClick={self._showModalTwo}>提交至云端</Button>
                    <Modal title="确认提交以下商品吗?"
                           visible={self.state.visibleTwo}
                           closable={false}
                           maskClosable={true}
                           okText='确认'
                           width='670'
                           cancelText='取消'
                           onOk={self._handleOkTwo}
                           onCancel={self._handleCancelTwo}>
                        <div className={style.modalOneDivsion}>
                            <GoodsItem goodsDetail={uploadClouds}/>
                        </div>
                    </Modal>
                </div>
        } else if (self.props.leftChecked && !self.props.rightChecked) {
            list =
                <div>
                    <Button size="large" disabled>配对</Button>
                    <Button size="large" disabled>取消配对</Button>
                    <Button type="primary" size="large" onClick={self._showModalTwo}>提交至云端</Button>
                    <Modal title="确认提交以下商品吗?"
                           visible={self.state.visibleTwo}
                           closable={false}
                           maskClosable={true}
                           okText='确认'
                           width='670'
                           cancelText='取消'
                           onOk={self._handleOkTwo}
                           onCancel={self._handleCancelTwo}>
                        <div className={style.modalOneDivsion}>
                            <GoodsItem goodsDetail={uploadClouds}/>
                        </div>
                    </Modal>
                </div>
        } else {
            list =
                <div>
                    <Button size="large" disabled>配对</Button>
                    <Button size="large" disabled>取消配对</Button>
                    <Button size="large" disabled>提交至云端</Button>
                </div>
        }

        return <div>{list}</div>;
    }
});
module.exports = operationOne;