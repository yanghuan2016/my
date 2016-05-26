
<!-- working side navigation -->
$('body').scrollspy({
		target: '.bs-docs-sidebar',
		offset: 40
});

$(document).ready(function() {

	var menu = $('#sidebar');
	var origOffsetY = menu.offset().top;

	function scroll() {
			if ($(window).scrollTop() >= origOffsetY) {
					$('#sidebar').addClass('affix');
					$('#sidebar').removeClass('affix-top');
			} else {
					$('#sidebar').removeClass('affix');
					$('#sidebar').addClass('affix-top');
			}


	}

	document.onscroll = scroll;

});
