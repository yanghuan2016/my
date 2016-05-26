/**
 *  处方单首页
 *
 */

var React = require('react');

var style = require('./recipeCreate.css');

var RecipeHeader = require('elements/recipeHeader/recipeHeader.jsx');
var RecipeTop = require('elements/recipeTop/recipeTop.jsx');
var RecipeList = require('elements/recipeList/recipeList.jsx');

var QueueAnim = require('antd').QueueAnim;
var recipeCreate = React.createClass({

    render: function () {
        return (
            <QueueAnim className="demo-content"
                       animConfig={[{ opacity: [1, 0], translateX: [0, 1000] },{ opacity: [1, 0], translateX: [0, -1000]}]}>
                <div key="a">
                    <RecipeHeader />

                    <div className={style.content}>
                        <RecipeTop />
                        <RecipeList/>
                    </div>
                </div>
            </QueueAnim>
        )
    }
});

module.exports = recipeCreate;