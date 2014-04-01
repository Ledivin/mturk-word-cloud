(function(window, $) {

	var turkUsername = "stackturk@gmail.com";
	var turkPassword = "cs565stackturk";
	
	var stackExchangeApi = {};
	var baseUrl = "http://api.stackexchange.com";
	//var filterUrl = "/2.2/filters/create?unsafe=false";
	var questionsUrl = "/2.2/questions?page=1&pagesize=$NUM_QUESTIONS&fromdate=$FROMDATE&todate=$TODATE&site=stackoverflow"
	//var questionsUrl = "/2.2/questions?page=1&pagesize=$NUM_QUESTIONS&fromdate=$FROMDATE&todate=$TODATE&site=stackoverflow&filter=!DDOGqODxvMPv19TZFAXSDPz9vSe8tstNS3sHSJa-9x0Cm_8(OEq"

	var defaultDate = 1389744000; //2014-01-15... randomly chosen
	var defaultQuestionId = 22737086; //randomly chosen

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
		var url = baseUrl + questionsUrl.replace("$NUM_QUESTIONS", num)
		                                .replace("$FROMDATE", date || defaultDate)
		                                .replace("$TODATE", defaultDate + 86400); // 1 day

		var response = ajax(url);
		if (response.status === "done") {
			return response.data.items;
		} else {
			console.log("AJAX call failed: " + url + " due to " + textStatus + " (" + errorThrown + ")");
			console.log("with num="+num+" and date="+(date||defaultDate));
			return null;
		}
	};

	window.stackExchange = stackExchangeApi;

})(window, jQuery)
