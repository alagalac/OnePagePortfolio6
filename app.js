
/*------------------------------------------------------------------
 Document ready
 ------------------------------------------------------------------*/




/*------------------------------------------------------------------
 Scrolling and navigation
 ------------------------------------------------------------------*/

$(document).ready(function () {
    $(document).on("scroll", onScroll);

    $('.header__navigation a').on('click', function (e) {
        e.preventDefault();
        $(document).off("scroll");
        
        $('a').each(function () {
            $(this).removeClass('active');
        })
        $(this).addClass('active');
      
        var target = this.hash,
            menu = target;
        $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top+2
        }, 500, 'swing', function () {
            window.location.hash = target;
            $(document).on("scroll", onScroll);
        });
    });
});

function onScroll(event){
    var scrollPos = $(document).scrollTop();
    $('.header__navigation a').each(function () {
        var currLink = $(this);
        var refElement = $(currLink.attr("href"));
        if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
            $('.header__navigation ul li a').removeClass("active");
            currLink.addClass("active");
        }
        else{
            currLink.removeClass("active");
        }
    });
}

/*------------------------------------------------------------------
 Thousands seperator commas
 ------------------------------------------------------------------*/

$(document).ready(function () {
    $('.inline-input--thousands').keyup(function(){
        $(this).val(addCommas($(this).val()));
    });
});

function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
    x1 = removeCommas(x1);
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function removeCommas(nStr)
{
	nStr += '';
    return nStr.replace( /,/g, '');
}

/*------------------------------------------------------------------
 Computations
 ------------------------------------------------------------------*/

 $(document).ready(function () {
     $('.inline-input').on('input', function(){
         emergencyFundComputations();
     });
 });

 /*------------------------------------------------------------------
  Emergency Fund Computations
 ------------------------------------------------------------------*/

 function emergencyFundComputations()
 {
     var income = parseInt(removeCommas($('#Salary').val()));
     $('#EmergencyMinimum').text(addCommas(income / 12 * 3));
     $('#EmergencyMaximum').text(addCommas(income / 12 * 6));
 }