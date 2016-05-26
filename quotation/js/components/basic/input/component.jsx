var React = require('react');
var Input = React.createClass({

    render: function () {
        var placeHolderContent = this.props.inputProps.placeHolderContent;
        var className = this.props.inputProps.className;
        var type = this.props.inputProps.type;
        return (
            <input value={this.props.keyValue}
                   onChange={this.props.onChange}
                   className={className}
                   type={type}
                   placeholder={placeHolderContent}
                />

        );
    }
});

module.exports = Input;