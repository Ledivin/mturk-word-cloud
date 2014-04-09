(function(window, $) {

	var turkUsername = "stackturk@gmail.com";
	var turkPassword = "cs565stackturk";
	
	var stackExchangeApi = {};
	var baseUrl = "http://api.stackexchange.com";
	var questionsUrl = "/2.2/questions?page=$PAGE&pagesize=$NUM_QUESTIONS&todate=$TODATE&site=stackoverflow&filter=!)58T.dxlk3e_DehDMaJ)WH8uYMZ1"

	var questionIdUrl = baseUrl + "/2.2/questions/$QUESTION_ID/";
		
	var latestDate = 1391489755; //Feb 4 2014... randomly chosen 2 months ago (anything before that)
	var currentPage = 3;
	
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
	
	stackExchangeApi.getHighestVotedAnswerForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"answers?order=desc&sort=votes&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return null;
		
		return response.data.items[0];
	};
	
	stackExchangeApi.getHighestReputationAnswerForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"answers?order=desc&sort=votes&site=stackoverflow")
		if (response === null || response.data.items.length === 0) 
			return null;
		
		var maxReputation = -1;
		var maxReputationIndex = -1;
		for (var i = 0; i < response.data.items.length; i++) {
			if (response.data.items[i].owner.reputation > maxReputation) {
				maxReputation = response.data.items[i].owner.reputation;
				maxReputationIndex = i;
			}
		}
		return response.data.items[maxReputationIndex];
	};
	
	stackExchangeApi.getHighestVotePlusReputationAnswerForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"answers?order=desc&sort=votes&site=stackoverflow")
		if (response === null || response.data.items.length === 0) 
			return null;

		var maxScore = -1;
		var maxScoreIndex = -1;
		for (var i = 0; i < response.data.items.length; i++) {
			var score = response.data.items[i].owner.reputation
					+ response.data.items[i].score
			if (score > maxScore) {
				maxScore = score;
				maxScoreIndex = i;
			}
		}
		return response.data.items[maxScoreIndex];
	}
	
	stackExchangeApi.getResponseTimeOfAcceptedAnswerForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return -1;
		
		var postTime = response.data.items[0].creation_date;
		var responseTime = postTime - 1;
		if (response.data.items[0].is_answered) {
			var answers = this.SEQuestionQueryResults(questionId,
					"answers?order=desc&sort=votes&site=stackoverflow");
			for (var i = 0; i < answers.data.items.length; i++) {
				if (answers.data.items[i].is_accepted) {
					responseTime = answers.data.items[i].creation_date;
					break;
				}
			}
		}
		else {
			console.log("Question " + questionId + " does not have an accepted response");
		}
		return responseTime - postTime;
	};
	
	stackExchangeApi.getResponseTimeOfHighestVotePlusReputationAnswerForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return -1;
		
		var postTime = response.data.items[0].creation_date;
		var responseTime = postTime - 1;
		
		var highestVotePlusRepResponse = this.getHighestVotePlusReputationAnswerForQuestionId(questionId);
		if (highestVotePlusRepResponse !== null)
			responseTime = highestVotePlusRepResponse.creation_date;
			
		return responseTime - postTime;
	};
	
	stackExchangeApi.getNumberOfAnswersForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return "n/a";
		
		return response.data.items[0].answer_count;
	};
	
	stackExchangeApi.getNumberOfVotesForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return "n/a";

		return response.data.items[0].score;
	};
	
	stackExchangeApi.getViewCountForQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null || response.data.items.length === 0) 
			return "n/a";

		return response.data.items[0].view_count;		
	};
	
	stackExchangeApi.SEQuestionQueryResults = function(questionId, query) {
		var query = questionIdUrl.replace("$QUESTION_ID", questionId) + query;
		if (this.queryIsCached(query))
			return this.getCachedQueryResponse(query);
		
		var response = ajax(query);
		if (response.status === "done") {
			this.cacheQueryResponse(query, response);
			return response;
		}
		else {
			console.log("AJAX call failed: " + url + " due to " + textStatus + " (" + errorThrown + ")");
			console.log("question id: " + questionId + ", query: " + query);
			return null;
		}
	};
	
	stackExchangeApi.getAuthorOfQuestionId = function(questionId) {
		var response = this.SEQuestionQueryResults(questionId, 
				"?order=desc&sort=activity&site=stackoverflow");
		if (response === null) 
			return null;

		return response.data.items[0].owner.display_name;	
	};
	
	stackExchangeApi.queryIsCached = function(query) {
		return (query in this.queryCache);
	}
	
	stackExchangeApi.getCachedQueryResponse = function(query) {
		return this.queryCache[query];
	}
	
	stackExchangeApi.cacheQueryResponse = function(query, response) {
		this.queryCache[query] = response;
	}
	
	stackExchangeApi.queryCache = {};

	window.stackExchange = stackExchangeApi;
	
})(window, jQuery)
