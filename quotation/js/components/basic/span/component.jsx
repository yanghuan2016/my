var React = require('react');

var Span=React.createClass({
    render:function(){
            return (
             <div className={this.props.spanProps.className}>
                 <span className={this.props.spanProps.spanClassName}>{this.props.spanProps.content}</span>
             </div>
            )
    }
});

module.exports=Span;