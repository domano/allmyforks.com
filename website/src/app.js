
var query = window.location.search.substring(1);
var qs = parse_query_string(query);


const donations = [
{
  "Name": "Bitcoin",
  "Address": "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"
}]

const currencies = [
	{
		"Name": "Dollar",
		"ShortName": "$",
		"Ratio": 1.0
	},
	{
		"Name": "Euro",
		"ShortName": "€",
		"Ratio": 0.849855227
	},

]

const languages = [
	{
		"Name": "English",
		"ShortName": "en",
	},
	{
		"Name": "Deutsch",
		"ShortName": "de",
	},
]

const config = {
	lang: qs.lang || languages[0].ShortName,
	currency: qs.currency || currencies[0].Name
}




var tableOuterElem = document.getElementById('table-forks-outer')
var sum = document.getElementById('sum-forks')
var sum2 = document.getElementById('sum-forks-top')

var htmlToAdd = '<table class="w3-table sortable" id="table-forks"><tr><th>#</th><th>Name</th><th class="w3-hide-small">Fork date</th><th class="w3-hide-small">Fork Block</th><th class="w3-hide-small">Price</th><th class="w3-hide-small">1 BTC=</th><th>1 BTC=</th></tr>'


var sumValues = 0

var data = window.data
data.coins[0].forks.map((e,index) => {
  var priceTimesRatio = e.Price*e.Ratio
  sumValues+=priceTimesRatio
  htmlToAdd += '<tr><td sorttable_customkey="'+index+'">#' + (index+1) + '</td><td><a href="'+e.Link+'">' + e.Name + '</a></td><td class="w3-hide-small">'+ e.Date+'</td><td class="w3-hide-small">'+ e.Block+'</td><td class="w3-hide-small" sorttable_customkey="'+e.Price+'">' + e.Price + ' € </td><td class="w3-hide-small">' + e.Ratio + ' ' + e.ShortName + '</td><td sorttable_customkey="'+priceTimesRatio+'">'+priceTimesRatio+' € </td></tr>'
})


sum.innerHTML = '<b>1 BTC= Sum forks '+sumValues+' €</b>'
sum2.innerHTML = '<b>1 BTC= Sum forks '+sumValues+' €</b>'

tableOuterElem.innerHTML = htmlToAdd + '</table>'





var tableDonations = document.getElementById('table-donations')
  var htmlToAdd = '' //<tr><th>Name</th><th>Address</th></tr>'
  






document.getElementById('select-languages').innerHTML = languages.map(e => '<option '+ (config.lang === e.ShortName ? 'selected' : '' ) + '>'+e.Name+'</option>')
document.getElementById('select-currencies').innerHTML = currencies.map(e => '<option>'+e.Name+'</option>')

donations.map((e,index) => {

    var row = document.createElement('tr')
    htmlToAdd += '<tr><td>' + e.Name + '</a></td><td>'+e.Address+'</td></tr>'
  })

//tableDonations.innerHTML = htmlToAdd