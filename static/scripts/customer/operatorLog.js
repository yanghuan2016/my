$(function(){
    var $oplogFilter= $('.operatorLogSearch');
    $oplogFilter.click(function(e){
        e.preventDefault();
        var keywords = $(this).prev('.filterInput').val();
        goFilter(keywords);
    })

    var $filterMan = $('.filterMan');
    $filterMan.click(function(){
        var ifAll = $(this).hasClass('all');
        if(ifAll){
            goFilter('');
            return;
        }
        var tmp = $('.cont-info').find('a')[0];
        var keywords = $(tmp).attr('title').trim();
        goFilter(keywords);
    })

    function goFilter(keywords){
        var url = "operatorLog?on=" + encodeURI(keywords);
        url += '&p=1&ps=10';
        window.location.href = url;
    }

})