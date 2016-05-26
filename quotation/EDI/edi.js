var React = require('react');
var ReactDom = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;

var Routes = require('./route');

ReactDom.render(<Router routes={Routes}/>, document.getElementById("app"));


