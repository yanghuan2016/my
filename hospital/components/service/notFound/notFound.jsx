var React = require('react');
var Logo = require('elements/logo/logo');
var style = require('./notFound.css');

module.exports = React.createClass({
    render: function () {
        return (
            <div className={style.container}>
                <h1>404!</h1>
            </div>
        )
    }
});