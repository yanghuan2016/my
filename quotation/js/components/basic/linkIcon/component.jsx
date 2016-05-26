var React = require('react');
var history = require('js/history');
import { Link } from 'react-router';
var LinkIcon = React.createClass({
    onClick: function () {
        history.goBack();
    },
    render: function () {

        if(this.props.url!=undefined){
            return(
                <Link style={{Height:'100%'}} to={this.props.url}>
                    <i className={this.props.iconClassName}></i>
                </Link>
            );

        }else{
        return (
            <a style={{Height:'100%'}} onClick={this.onClick}>
                <i className={this.props.iconClassName}></i>
            </a>
        );
        }
    }
});

module.exports = LinkIcon;