var React = require('react');
var FontAwesomeIcon = require('js/components/basic/fontawesome/component');
var style = require('./SingleSpanRow.css');

var SingleSpanRow = React.createClass({
    render: function () {
        var self = this;
        var isDisabled = self.props.inputDisabled == false ? "readonly" : "";
        return (
            <div onClick={self.props.onClick} className={style.singleContainer+ ' '+self.props.className}>
                <div>
                    <span>{self.props.keyWord}</span>
                </div>
                <div key={'node'} className={style.secondSubNode}>
                    <input
                        ref={self.props.refValue}
                        type={self.props.inputType||'text'}
                        placeholder={self.props.placeholder}
                        readOnly={isDisabled}
                        onChange={self.props.onChange}
                        defaultValue={self.props.keyValue}
                        className={style.commonInput}/>
                    <FontAwesomeIcon className={style.spaceLeft} name={self.props.iconName?self.props.iconName:""}/>
                </div>
            </div>
        );
    }
});

module.exports = SingleSpanRow;