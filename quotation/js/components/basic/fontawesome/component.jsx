var React = require('react');
var FontAwesome = require('react-fontawesome');
var FontAwesomeIcon = React.createClass({
    render: function () {
        return (<FontAwesome className={this.props.className} name={this.props.name}/>);
    }
});

module.exports = FontAwesomeIcon;