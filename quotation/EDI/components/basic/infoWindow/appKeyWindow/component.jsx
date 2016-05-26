var React = require('react');
var Button = require('antd').Button;
var Modal = require('ediComponents/basic/infoWindow/basicWindow/component');

var PasswordInfoWindow = React.createClass({
    getInitialState: function () {
        return {
            winContent: [<p key="111">请将新的APPKEY值写入到ERP系统中</p>],
            winTital: "提醒",
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