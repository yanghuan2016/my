var React = require('react');
var style = require('./loading.css');
var Progress = require('antd').Progress;
var ProgressCircle = Progress.Circle;

//this.props.percent    当前的百分比
//this.props.loading(选填)     当loading为true的时候,加载font-awesome进行中效果,不传这个参数时加载进度条.
var Loading = React.createClass({
    //componentDidMount: function () {
    //    var me=this;
    //    window.setTimeout(function () {
    //        if (me.props.percent < 100)
    //            me.props.updatePercent && me.props.updatePercent();
    //    }, 2000)
    //},
    render: function () {
        if (this.props.loading) {
            return (
                <div className={style.loading}>
                    <i className={style.rotation+" fa fa-spinner fa-pulse fa-3x fa-fw margin-bottom"}></i>
                    <span className="sr-only">erp同步中...</span>
                </div>
            )
        } else
            return (
                <div className={style.percent}>
                    <ProgressCircle percent={this.props.percent} width={60} format={() => 'erp同步中...'}/>
                </div>
            )
    }
});
module.exports = Loading;