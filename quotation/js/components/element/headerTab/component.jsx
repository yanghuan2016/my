var React=require('react');
var style=require('./headerTab.css');

var HeaderTab=React.createClass({


        render:function(){
            var type=this.props.tabProps.focusOn;//  type='left'  or  'right'
            var leftClass='';
            var rightClass='';

            if(type=='left'){
                leftClass=style.subDivFocus;
            }else{
                rightClass=style.subDivFocus;
            }
            return (
                <div className={style.divContainer}>
                    <div   onClick={this.props.tabProps.leftClick}      className={style.subDiv+' '+leftClass}>

                        {this.props.tabProps.leftText}
                    </div>

                    <div  onClick={this.props.tabProps.rightClick} className={style.subDiv+' '+rightClass}>

                        {this.props.tabProps.rightText}

                    </div>

                </div>);
        }

});
module.exports=HeaderTab;