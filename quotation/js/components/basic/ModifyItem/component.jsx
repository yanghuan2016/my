var React = require('react');
var Header = require('js/components/element/header/component');
var InputItem = require('js/components/basic/input/component');
var style = require('./ModifyItem.css');

//var onChangeEvent=this.props.onChange;

var ModifyItem = React.createClass({

    render: function () {
        var self = this;
        var inputProps = self.props.inputProps;
        var headerSpanTxt = self.props.headerSpanTxt;
        var iconProps = self.props.iconProps;
        return (
            <div className={style.divContainer}>
                <Header spanText={headerSpanTxt}
                        iconProps={iconProps}
                        onClick={self.props.onClick}
                    />

                <div className={style.inputContainer}>
                    <InputItem inputProps={inputProps}
                               onChange={self.props.onChange}
                               keyValue={self.props.keyValue}
                        />
                </div>
            </div>);
    }
});

module.exports = ModifyItem;