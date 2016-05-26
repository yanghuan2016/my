/**
 *  处方单首页
 *
 */

var React = require('react');

var style = require('./recipeDetail.css');

var RecipeHeader = require('elements/recipeHeader/recipeHeader.jsx');
var RecipeTop = require('elements/recipeTop/recipeTop.jsx');
var RecipeList = require('elements/recipeList/recipeList.jsx');
var userStore = require('stores/userStore.js');
var cookie = require('util/cookieUtil');
var patientListAction = require('action/patientListAction.js');
var productStore = require('stores/productStore.js');

var QueueAnim = require('antd').QueueAnim;

var recipeCreate = React.createClass({

    componentWillMount: function () {
        var selectRecipeList = productStore.getSelectRecipeList();
        if (selectRecipeList.length === 0) {
            var prescriptionInfoId = cookie.getItem('prescriptionInfoId');
            var doctorId = userStore.getDoctorId();
            var diagnosisId = userStore.getDiagnosisId();
            patientListAction.getReciptDetail(prescriptionInfoId, doctorId, diagnosisId);
        }
    },

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