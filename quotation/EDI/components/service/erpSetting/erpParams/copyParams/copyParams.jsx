/**
 * erp参数设置页面
 */
var React = require('react');
var message = require('antd').message;
var style = require('./copyParams.css');
var validateAction = require('ediAction/validateAction');
var validateStore = require('ediStores/validateStore');
var userStore = require('ediStores/userStore');
var CopyToClipboard = require('react-copy-to-clipboard');

module.exports = React.createClass({
    getInitialState: function () {
        return {value: '', copied: false};
    },
    onCopy() {
        this.setState({copied: true});
        message.success("复制成功");
    },
    render: function () {
        return (
            <table className={style.CopyTable}>
                <colgroup>
                    <col width="200px"/>
                    <col width="450px"/>
                </colgroup>
                <tbody>
                <tr>
                    <td className={style.firstCopy}>APPKEY:</td>
                    <td>{this.props.appKey}</td>
                    <td>
                        <CopyToClipboard className={style.CopyBt} text={this.props.appKey}
                                         onCopy={this.onCopy}><span>复制</span></CopyToClipboard>
                    </td>
                </tr>
                <tr>
                    <td className={style.firstCopy}>SCC端消息URL:</td>
                    <td>{this.props.SccMsgUrl}</td>
                    <td>
                        <CopyToClipboard className={style.CopyBt} text={this.props.SccMsgUrl}
                                         onCopy={this.onCopy}><span>复制</span></CopyToClipboard>
                    </td>
                </tr>
                <tr>
                    <td className={style.firstCopy}>SCC端APPCODE URL:</td>
                    <td>{this.props.SccAppCodeUrl}</td>
                    <td>
                        <CopyToClipboard className={style.CopyBt} text={this.props.SccAppCodeUrl}
                                         onCopy={this.onCopy}><span>复制</span></CopyToClipboard>
                    </td>
                </tr>
                </tbody>
            </table>
        )
    }
});