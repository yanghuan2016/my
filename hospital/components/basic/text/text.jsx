/**
 * 基础文本组件,1列
 * @type {*|exports|module.exports}
 */
var React=require('react'),
    style=require('./text.css');


const Text=React.createClass({
    render:function(){
         var containerClass=this.props.containerClass,
             textClass=this.props.textClass,
             text=this.props.text;
         return (
            <div className={style.textContainer +' '+containerClass  }>
                <span className={style.text +' '+textClass}>
                    {text}
                </span>

            </div>
         );
    }
});
module.exports=Text;