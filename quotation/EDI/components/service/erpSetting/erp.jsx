var React = require('react');
var style = require('./erp.css');
var Header = require('ediComponents/basic/tabs/component');
var ErpParams = require('./erpParams/erpParams');
var ErpAsync = require('./erpAsync/erpAsync');

var Erp = React.createClass({
    getInitialState: function () {
        return {
            ErpParamsPage: null,
            ErpAsyncPage: style.hidden
        }
    },
    changePage: function (id) {
        if (id == "ErpParams") {
            this.setState({
                ErpParamsPage: null,
                ErpAsyncPage: style.hidden
            })
        } else {
            this.setState({
                ErpParamsPage: style.hidden,
                ErpAsyncPage: null
            })
        }
    },
    render: function () {
        return (
            <div>
                <Header onChange={this.changePage}/>

                <div className={this.state.ErpParamsPage}><ErpParams/></div>
                <div className={this.state.ErpAsyncPage}><ErpAsync/></div>
            </div>

        )
    }
});
module.exports = Erp;