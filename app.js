
/*------------------------------------------------------------------
 Constants
 ------------------------------------------------------------------*/
var IncomeTaxBrackets = [
    {'threshold':14000, 'rate':10.5}, 
    {'threshold':48000, 'rate':17.5}, 
    {'threshold':70000, 'rate':30}, 
    {'threshold':Number.MAX_VALUE, 'rate':33}
    ];

var ESCTTaxBrackets = [
    {'threshold':16800, 'rate':10.5}, 
    {'threshold':57600, 'rate':17.5}, 
    {'threshold':84000, 'rate':30}, 
    {'threshold':Number.MAX_VALUE, 'rate':33}
    ];

var ACCLevyRate = 1.39;
var ACCLevyMaxIncome = 122063;
var MTCThreshold = 1042.86;
var StudentLoanDeductionRate = 12;
var StudentLoanRepaymentThreshold = 19080;

var MortgageRatesToCalculate = [4, 5, 6, 7, 8, 9, 10]
var MortgageTerm = 25;
var MortgageDepositPercentage = 20;

/*------------------------------------------------------------------
 Globals
 ------------------------------------------------------------------*/
var TakeHomePay = 0;

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
	return x1; // + x2;
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
         detailsComputations();
         emergencyFundComputations();
         accomodationComputations();
     });
 });

/*------------------------------------------------------------------
  Details Computations
 ------------------------------------------------------------------*/
function detailsComputations()
{
    // Pay calculations
    var income = parseInt(removeCommas($('#Salary').val()));
    $('#GrossPay').text(addCommas(income));

    var incomeTax = calculateIncomeTax(income);
    $('#IncomeTax').text(addCommas(incomeTax));

    var accLevy = calculateACCLevy(income);
    $('#ACCLevy').text(addCommas(accLevy));

    var kiwiSaver = calculateEmployeeKiwisaverContributions(income, $('#KiwiSaverContributionRate').val());
    $('#KiwiSaver').text(addCommas(kiwiSaver));

    var studentLoan = calculateStudentLoanRepayments(income) * $('#HasStudentLoan').val();
    $('#StudentLoan').text(addCommas(studentLoan));

    TakeHomePay = income - incomeTax - accLevy - kiwiSaver - studentLoan;
    $('#TakeHomePay').text(addCommas(TakeHomePay));

    // Kiwisaver calculations
    $('#EmployeeContribution').text(addCommas(kiwiSaver));
    $('#EmployerContribution').text(addCommas(calculateEmployerKiwisaverContributions(income)));
    $('#GovernmentContribution').text(addCommas(calculateMemberTaxCredit(kiwiSaver)));
    
}

function calculateIncomeTax(income)
{
    var tax = 0;
    var previousThreshold = 0;
    
    for(var i = 0; i < IncomeTaxBrackets.length; i++)
    {
        var rate = IncomeTaxBrackets[i].rate / 100;

        if(income > IncomeTaxBrackets[i].threshold)
        {
            tax += (IncomeTaxBrackets[i].threshold - previousThreshold) * rate;
        }
        else if (income > previousThreshold)
        {
            tax += (income - previousThreshold) * rate;
        }

        previousThreshold = IncomeTaxBrackets[i].threshold;
    }

    return tax;
}

function calculateACCLevy(income)
{
    if (income > ACCLevyMaxIncome)
    {
        return ACCLevyMaxIncome * (ACCLevyRate / 100);
    }

    return income * (ACCLevyRate / 100);
}

function calculateEmployeeKiwisaverContributions(income, contibutionRate)
{
    return income * (contibutionRate / 100);
}

function calculateEmployerKiwisaverContributions(income)
{
    var employerContribution = (income * (3 / 100));
    employerContribution -= calculateESCT(employerContribution);

    return employerContribution;
}

function calculateESCT(incomeWithEmployerContributions)
{
    var tax = 0;
    var previousThreshold = 0;
    
    for(var i = 0; i < IncomeTaxBrackets.length; i++)
    {
        var rate = ESCTTaxBrackets[i].rate / 100;

        if(incomeWithEmployerContributions > ESCTTaxBrackets[i].threshold)
        {
            tax += (ESCTTaxBrackets[i].threshold - previousThreshold) * rate;
        }
        else if (incomeWithEmployerContributions > previousThreshold)
        {
            tax += (incomeWithEmployerContributions - previousThreshold) * rate;
        }

        previousThreshold = ESCTTaxBrackets[i].threshold;
    }

    return tax;
}

function calculateMemberTaxCredit(employeeContributions)
{
    var amount = Math.min(employeeContributions, MTCThreshold);
    return amount / 2;
}

function calculateStudentLoanRepayments(income)
{
    if(income > StudentLoanRepaymentThreshold)
    {
        return income * (StudentLoanDeductionRate / 100);
    }

    return 0;
}

/*------------------------------------------------------------------
  Emergency Fund Computations
------------------------------------------------------------------*/
function emergencyFundComputations()
{
    $('#EmergencyMinimum').text(addCommas(TakeHomePay / 12 * 3));
    $('#EmergencyMaximum').text(addCommas(TakeHomePay / 12 * 6));
}

/*------------------------------------------------------------------
  Accomodation Computations
------------------------------------------------------------------*/
function accomodationComputations()
{
    var monthlyAccomodation = (TakeHomePay / 12) / 3;
    $('#MonthlyAccomodation').text(addCommas(monthlyAccomodation));
    $('#MortgageTableBody').empty();

    for (var i = 0; i < MortgageRatesToCalculate.length; i++)
    {
        var row = $('<tr>');
        row.append($('<td>').text(MortgageRatesToCalculate[i] + '%'));
        var mortgageValue = calculateMortgagePrincipal(monthlyAccomodation, MortgageRatesToCalculate[i], MortgageTerm) / (1 - (MortgageDepositPercentage / 100));
        row.append($('<td>').text('$' + addCommas(mortgageValue)).addClass('right-align'));
        $('#MortgageTableBody').append(row);
    }
}

function calculateMortgagePrincipal(monthlyPayment, annualInterestRate, years)
{
    var monthlyRate = (annualInterestRate / 12) / 100; // Assuming annual rate isn't compounded. Usually it isn't.
    var terms = years * 12;

    var principal = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -terms)) / monthlyRate);
    return principal;
}