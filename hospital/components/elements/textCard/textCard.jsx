/**
 *
 * 展示文本的组件,两列  左边是属性名字,右边是属性值
 */
var React = require('react');
var style = require('./textCard.css');

var TextCard = React.createClass({
    getDefaultProps: function(){
        return {
            goods: [{
                name: "取药地址",
                nameClass: "",
                value: "成都高新区天府大道30号 幸福大药房",
                valueClass:""
            },
                {
                    name: "营业时间",
                    nameClass: "",
                    value: "09:00-18:00",
                    valueClass:""
                },
                {
                    name: "联系电话",
                    nameClass: "",
                    value: 15196634249,
                    valueClass:""
                }, {
                    name: "到店支付",
                    nameClass: "",
                    value: "$ 29",
                    valueClass:""

                }]
        };
    },
    getInitialState: function () {
        return {
            goods:this.props.goods
        };
    },

    render: function(){
        var  content = [];
        this.state.goods.map(function(item){
            content.push(<div className={style.textContainer}>
                <span className={style.firstItem + ' '+item.nameClass }>{item.name}:</span>
                <span className={style.secondItem+ ' '+item.valueClass}>{item.value}</span></div>);
        });
        return (
            <div className={style.box}>
                {content}
            </div>
        )
    }
});
module.exports = TextCard;