var React = require('react');
var BasicInput=require('js/components/basic/input/component');

var LoginInput=React.createClass({
    render:function(){
            return (
                <div className={this.props.className}>
                    <BasicInput onChange={this.props.onChange}  inputProps={this.props.inputProps} />
            </div>);
    }
});
module.exports=LoginInput;