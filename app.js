
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

var KiwiSaverContributionRates = [0, 3, 4, 8]
var KiwiSaverFundTypes = [
    {'name': 'Conservative', 'return': 3},
    {'name': 'Balanced', 'return': 5},
    {'name': 'Growth', 'return': 7},
    ]
var RetirementAge = 65;

var ChartColours = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)'
];

/*------------------------------------------------------------------
 Globals
 ------------------------------------------------------------------*/
var TakeHomePay = 0;
var incomeChart;
var mortgageChart;
var retirementChart;

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
  Details Computations
 ------------------------------------------------------------------*/
function detailsComputations()
{
    // Pay calculations
    var income = parseInt(removeCommas($('#Salary').val())) || 0;
    var incomeTax = calculateIncomeTax(income);
    var accLevy = calculateACCLevy(income);
    var kiwiSaver = calculateEmployeeKiwisaverContributions(income, $('#KiwiSaverContributionRate').val());
    var studentLoan = calculateStudentLoanRepayments(income) * $('#HasStudentLoan').val();
    TakeHomePay = income - incomeTax - accLevy - kiwiSaver - studentLoan;

    /*
    $('#GrossPay').text(addCommas(income));
    $('#IncomeTax').text(addCommas(incomeTax));
    $('#ACCLevy').text(addCommas(accLevy));
    $('#KiwiSaver').text(addCommas(kiwiSaver));
    $('#StudentLoan').text(addCommas(studentLoan));
    $('#TakeHomePay').text(addCommas(TakeHomePay));

    // Kiwisaver calculations
    $('#EmployeeContribution').text(addCommas(kiwiSaver));
    $('#EmployerContribution').text(addCommas(calculateEmployerKiwisaverContributions(income, $('#KiwiSaverContributionRate').val())));
    $('#GovernmentContribution').text(addCommas(calculateMemberTaxCredit(kiwiSaver)));
    */
    
    var updatedChartData = [TakeHomePay, incomeTax, accLevy, kiwiSaver, studentLoan];
    incomeChart.data.datasets[0].data = updatedChartData;
    incomeChart.update();
    
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

function calculateKiwisaverContributions(income, contributionRate)
{
    var employee = calculateEmployeeKiwisaverContributions(income, contributionRate);
    var employer = calculateEmployerKiwisaverContributions(income, contributionRate);
    var govt = calculateMemberTaxCredit(employee);

    return employee + employer + govt;
}

function calculateEmployeeKiwisaverContributions(income, contibutionRate)
{
    return income * (contibutionRate / 100);
}

function calculateEmployerKiwisaverContributions(income, contibutionRate)
{
    if (contibutionRate == 0)
    {
        return 0;
    }

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

    var labels = [];
    var data = [];

    for (var i = 0; i < MortgageRatesToCalculate.length; i++)
    {
        var mortgageValue = calculateMortgagePrincipal(monthlyAccomodation, MortgageRatesToCalculate[i], MortgageTerm) / (1 - (MortgageDepositPercentage / 100));

        labels.push(MortgageRatesToCalculate[i] + '%');
        data.push(mortgageValue);
    }

    /* Chart time */
    mortgageChart.data.labels = labels;
    mortgageChart.data.datasets[0].data = data;
    mortgageChart.update();

}

function calculateMortgagePrincipal(monthlyPayment, annualInterestRate, years)
{
    var monthlyRate = (annualInterestRate / 12) / 100; // Assuming annual rate isn't compounded. Usually it isn't.
    var terms = years * 12;

    var principal = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -terms)) / monthlyRate);
    return principal;
}

/*------------------------------------------------------------------
 Retirement Computations
------------------------------------------------------------------*/
function retirementComputations()
{
    var postRetirementExpenditure = TakeHomePay * 0.8;
    $('#PostRetirementExpenditure').text(addCommas(postRetirementExpenditure));

    var income = parseInt(removeCommas($('#Salary').val())) || 0;

    var currentBalance = parseInt(removeCommas($('#KiwiSaverBalance').val())) || 0;

    var datasets = [];

    for(var i = 0; i < KiwiSaverContributionRates.length; i++)
    {
        var years = RetirementAge - $('#Age').val();
        var principal = currentBalance;
        var compoundsPerYear = 12; // Also number of contributions

        var rowData = {
            label: KiwiSaverContributionRates[i],
            backgroundColor: ChartColours[i],
            data: []
        };

        for(var j = 0; j < KiwiSaverFundTypes.length; j++)
        {
            var rate = KiwiSaverFundTypes[j].return / 100;
            var contribution = calculateKiwisaverContributions(income, KiwiSaverContributionRates[i]) / 12; // Contribution per period.

            var compoundInterestForPrincipal = principal * Math.pow((1 + (rate / compoundsPerYear)), compoundsPerYear * years);
            var FVOfSeries = contribution * ((Math.pow(1 + (rate / compoundsPerYear), compoundsPerYear * years) - 1) / (rate / compoundsPerYear));
            rowData.data.push(compoundInterestForPrincipal + FVOfSeries);
        }

        datasets.push(rowData);
    }

    /* Chart time */
    retirementChart.data.datasets = datasets;
    retirementChart.update();
}

/*------------------------------------------------------------------
  Computations
 ------------------------------------------------------------------*/
$(document).ready(function () {
    $('.inline-input').on('input', function(){
        detailsComputations();
        emergencyFundComputations();
        accomodationComputations();
        retirementComputations();
    });

    detailsComputations();
    emergencyFundComputations();
    accomodationComputations();
    retirementComputations();
 });

 /*------------------------------------------------------------------
  Income Chart
 ------------------------------------------------------------------*/
$(document).ready(function () {
    var incomeChartData = {
        labels: ['Take Home Pay', 'Income Tax', 'ACC Levy', 'KiwiSaver Contributions', 'Student Loan Payments'],
        datasets: [{ 
            data: [0, 0, 0, 0, 0],
            backgroundColor: ChartColours
        }]
    };

    var incomeChartOptions = {
        legend: {
            display: false
        },
        tooltips: {
            callbacks: {
                label: function(tooltipItem, data) { 
                    return data.labels[tooltipItem.index] + ': $' + addCommas(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);
                }
            }
        }
    }

    incomeChart = new Chart($('#IncomeChart'), {
        type: 'doughnut',
        data: incomeChartData,
        options: incomeChartOptions
    });
 });

 /*------------------------------------------------------------------
  Mortgage Chart
 ------------------------------------------------------------------*/
$(document).ready(function () {
    var mortgageChartData = {
        labels: [],
        datasets: [{ 
            data: [],
            backgroundColor: ChartColours
        }]
    };

    var mortgageChartOptions = {
        legend: {
            display: false
        },
        tooltips: {
            callbacks: {
                title: function() {
					return '';
				},
                label: function(tooltipItem, data) { 
                    return '$' + addCommas(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);
                }
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }

    mortgageChart = new Chart($('#MortgageChart'), {
        type: 'bar',
        data: mortgageChartData,
        options: mortgageChartOptions
    });
 });

 /*------------------------------------------------------------------
  Retirement Chart
 ------------------------------------------------------------------*/
$(document).ready(function () {
    var retirementChartData = {
        labels: ['Conservative', 'Balanced', 'Growth'],
        datasets: []
    };

    var retirementChartOptions = {
        legend: {
            display: false
        },
        tooltips: {
            callbacks: {
                label: function(tooltipItem, data) { 
                    var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
                    return datasetLabel + '% Contribution rate: $' + addCommas(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);
                }
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }

    retirementChart = new Chart($('#RetirementChart'), {
        type: 'bar',
        data: retirementChartData,
        options: retirementChartOptions
    });
 });