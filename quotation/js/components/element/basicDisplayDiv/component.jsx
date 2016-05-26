var React=require('react');
var style=require('./basicDisplayDiv.css');

var BasicDisplayDiv=React.createClass({
        render:function(){
            return(
                <div className={style.displayDivContainer}>
                    <div className={style.firstDiv}>{this.props.leftText||'参考价格'}</div>
                    <div className={style.secondDiv}>{this.props.rightText}</div>
                </div>
            );
        }
});

module.exports=BasicDisplayDiv;


