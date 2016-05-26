var React = require('react');
var Button = require('antd').Button;
var Modal = require('ediComponents/basic/infoWindow/basicWindow/component');

var PasswordInfoWindow = React.createClass({
    getInitialState: function () {
        return {
            winContent: [<p>正在和ERP同步数据，请数据同步完成后再试！</p>],
            winTital: "提醒",
            winFooter: [
                <Button key="submit" type="primary" size="large" onClick={this.handleCancel}>确认</Button>
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