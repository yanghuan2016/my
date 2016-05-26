/**
 * 页面
 *
 */

var React = require('react');
var style = require('./body.css');

var LeftBar = require('elements/leftBar/leftBar');
var MedicinePaper = require('elements/medicinePaper/medicinePaper');

var Body = React.createClass({

    render: function () {
        return (
            <div className={style.body}>
                <div className={style.left}>
                    <LeftBar />
                </div>
                <div className={style.right}>
                    {this.props.children}
                </div>
                <MedicinePaper />
            </div>
        )
    }
});

module.exports = Body;