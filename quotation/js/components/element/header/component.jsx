var React = require('react');
var LinkIcon = require('js/components/basic/linkIcon/component');
var style = require('./header.css');
var Link = require('react-router').Link;

var Header = React.createClass({
    render: function () {
        var thirdLinkIcon = "";
        if (this.props.iconProps.secondIconProps.url != undefined
            && this.props.iconProps.secondIconProps.context == undefined) {
            thirdLinkIcon = <div className={style.inlineDivSide} style={{textAlign:'right',paddingRight:'6px'}}>
                <LinkIcon url={this.props.iconProps.secondIconProps.url}
                          iconClassName={this.props.iconProps.secondIconProps.iconClassName + ' '+style.headerFontSet}
                    />
            </div>;
        } else if (this.props.iconProps.secondIconProps.context != undefined) {
            thirdLinkIcon = <div onClick={this.props.iconProps.secondIconProps.clickEvent}
                                 className={style.inlineDivSide+' ' +style.headerFontLowFontSize }>
                <span>{this.props.iconProps.secondIconProps.context}</span>
            </div>;
        }
        return (
            <div className={style.headerBackGround}>
                <div className={style.inlineDivSide}>
                    <LinkIcon url={this.props.iconProps.firstIconProps.url}
                              iconClassName={style.iconClass+' '+this.props.iconProps.firstIconProps.iconClassName }/>
                </div>
                <div className={style.inlineDivCenter}>
                    <span>{this.props.spanText}</span>
                </div>
                {thirdLinkIcon}
            </div>
        )
    }
});

module.exports = Header;