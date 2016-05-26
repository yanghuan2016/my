var React = require('react');
var Button = require('antd').Button;
var style = require('./passwordInfoWindow.css');
var Modal = require('ediComponents/basic/infoWindow/basicWindow/component');

var PasswordInfoWindow = React.createClass({
    getInitialState: function () {
        return {
            winContent: [<p className={style.discribe}>{this.props.discribe}</p>
                ,
                <input type="password" className={style.password + " password"} name="savePs" placeholder="请输入登陆密码"/>],
            winTital: "认证",
            winFooter: [
                <Button key="submit" type="primary" size="large" onClick={this.handleOk}>确认</Button>,
                <Button key="back" type="ghost" size="large" onClick={this.handleCancel}>取消</Button>
            ],
            winWidth: "400"
        }
    },
    handleCancel: function (event) {
        this.props.handleCancel(event);
    },
    handleOk: function (event) {
        this.props.handleOk(event);
    },
    render: function () {
        return (
            <Modal winTital={this.state.winTital} visible={this.props.visible} winWidth={this.state.winWidth}
                   handleCancel={this.handleCancel} winFooter={this.state.winFooter}
                   winContent={this.state.winContent}>

            </Modal>
        )
    }
});
module.exports = PasswordInfoWindow;