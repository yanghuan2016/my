var React=require('react');
var style=require('./bottomButtonGroup.css');

var ButtonGroup=React.createClass({
   render:function(){
        return (
            <div className={style.buttonGroup+' ' +this.props.buttonGroupClass}>
                <div   className={style.subDiv}  onClick={this.props.onLeftClick}>{this.props.leftBtnText} </div>
                <div   className={style.subRightDiv}  onClick={this.props.onRightClick}>{this.props.rightBtnText}</div>
            </div>
        )
   }
});

module.exports=ButtonGroup;

