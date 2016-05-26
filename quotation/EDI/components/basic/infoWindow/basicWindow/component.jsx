var React = require('react');
var Modal = require('antd').Modal;

var basicWindow = React.createClass({
    handleCancel: function (event) {
        this.props.handleCancel(event)
    },
    handleOk: function (event) {
        this.props.handleOk(event)
    },
    render: function () {
        return (
            <Modal title={this.props.winTital} visible={this.props.visible} width={this.props.winWidth}
                   onOk={this.handleOk} onCancel={this.handleCancel} footer={this.props.winFooter}>
                {this.props.winContent}
            </Modal>
        )
    }
});
module.exports = basicWindow;