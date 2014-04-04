(function(window, $) {

	var turkUsername = "stackturk@gmail.com";
	var turkPassword = "cs565stackturk";
	
	var stackExchangeApi = {};
	var baseUrl = "http://api.stackexchange.com";
	var questionsUrl = "/2.2/questions?page=$PAGE&pagesize=$NUM_QUESTIONS&todate=$TODATE&site=stackoverflow&filter=!)58T.dxlk3e_DehDMaJ)WH8uYMZ1"

	var latestDate = 1391489755; //Feb 4 2014... randomly chosen 2 months ago (anything before that)
	var currentPage = 0;
	
	var ajax = function(url) {
		var ret = null;

		$.ajax({
			url: url,
			type: "GET",
			dataType: "json",
			async: false
		}).done(function(data) {
			ret = {
				status: "done",
				data: data
			};
		}).fail(function(xhr, textStatus, errorThrown) {
			ret = {
				status: "fail",
				data: [ xhr, textStatus, errorThrown ]
			};
		});

		console.log("Quota remaining: " + ret.data.quota_remaining);

		return ret;
	};

	stackExchangeApi.getQuestions = function(num, date) {
		
		currentPage++; //would put some error checking here... but figure we're not going to overrun this with testing :P
		
		var url = baseUrl + questionsUrl.replace("$NUM_QUESTIONS", num)
										.replace("$PAGE", currentPage)
		                                .replace("$TODATE", latestDate);  // questions before this date
		console.log(url);
		var response = ajax(url);
		if (response.status === "done") {
			console.log(response.data.items);
			return response.data.items;
		} else {
			console.log("AJAX call failed: " + url + " due to " + textStatus + " (" + errorThrown + ")");
			console.log("with num="+num+" and date="+(date||defaultDate));
			return null;
		}
	};

	window.stackExchange = stackExchangeApi;
	
})(window, jQuery)
