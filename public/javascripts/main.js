$(function() {
	/**
	 * Create a new hit with URL and # of assignments
	 */
	$('#stack_overflow_form').submit(function(e) {
		e.preventDefault();
		// preventing default click action
		
		$("#result").empty();
		$("#hits").empty();
        
        var questionUrlsString = $("#questions").val();
        var numAssignments = $("#assignments").val();
        var reward = $("#reward").val();

        // create array with questionUrls
        var questionUrls = questionUrlsString.split(/[, \s]+/);
        console.log(questionUrls);
        create_hit(questionUrls, numAssignments, reward); 
	});
	
	$("#getHitOptions").click(function() {
		$.get("api/hits")
			.done(function( data ) {
				
				$("#getHitOptions").addClass("hidden");

				for(var num in data) {
					var hit = data[num];
					var checkboxMarkup = '<input type="checkbox" name="hitIds" value="' + hit.hitId + '" data-url="' + hit.url + '">' + " " + hit.title + " " + hit.time + '<br>';
					$("#hitOptions").append(checkboxMarkup);
				}
				
				$('#results_form').removeClass("hidden");
				
			});
	});
    
	$('#results_form').submit(function(e) {
		e.preventDefault();
		
		var hits = [];
		$("input:checkbox[name=hitIds]:checked").each(function() {
			hits.push({
				"id" : $(this).val(),
				"url" : $(this).attr("data-url")
			});
		});

		getResultsForHits(hits);
	});

	var create_hit = function(questions, assignments, reward) {
		
		$.ajax({
			url: '/api/hit',
			type: 'post',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify({
				questions: questions,
				assignments: assignments,
				reward: reward
			}),
			success : function(data) {
                				
                $("#result").text("The following HITs have been generated:");
                
                $("#hits").append("<tr><th>URL</th><th>HIT ID</th></tr>");
                for(var key in data) {
                	$("#hits").append("<tr><td>" + key + "</td><td>" + data[key] + "</td></tr>");
                }

			},
			error : function(data) {
				
				if(data.responseText === "Too much data!") {
						
					var halfSize = questions.length / 2;
					var questionsA = questions.slice(0, halfSize);
					var questionsB = questions.slice(halfSize);
					
					create_hit(questionsA, assignments, reward);
					create_hit(questionsB, assignments, reward);
					
				}
				
				else {
					$("#result").text("The HIT could not be generated.");
				}
			}
		});
		
	}
	
	var downloadHitResults = function (data) {
        var json = JSON.stringify(data),
            blob = new Blob([json], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        $("#download").attr("href", url);
        $("#download").attr("download", "results.json");
        $("#download").removeClass("hidden");
    };
	
	
	var getResultsForHits = function(hits) {
		
		$.ajax({
			url: '/api/results',
			type: 'post',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify({
				hits: hits
			}),
			success : function(data) {
				data = addStackExchObjectiveInfo(data);
				downloadHitResults(data);
			},
			error : function(data) {			
				console.log("error");
				console.log(data);
			}
		});
		
	}
	
	var addStackExchObjectiveInfo = function(results) {
		$.each(results, function(url, responses) {
			var questionData = {};
			console.log("Getting SO info for url: " + url);
			var questionId = getQuestionIdFromUrl(url);
			
			var highestVotedResponse = window.stackExchange.getHighestVotedAnswerForQuestionId(questionId);
			if (highestVotedResponse === undefined || highestVotedResponse === null)
				questionData["SOQuestionData_HighestResponseVote"] 
					= "n/a";
			else
				questionData["SOQuestionData_HighestResponseVote"] 
					= highestVotedResponse.score;
			
			var highestReputationResponse = window.stackExchange.getHighestReputationAnswerForQuestionId(questionId);
			if (highestReputationResponse === undefined || highestReputationResponse === null)
				questionData["SOQuestionData_HighestResponseReputation"] 
					= "n/a";
			else
				questionData["SOQuestionData_HighestResponseReputation"] 
					= highestReputationResponse.owner.reputation;
		
			var highestRepPlusVoteResponse = window.stackExchange.getHighestVotePlusReputationAnswerForQuestionId(questionId);
			if (highestRepPlusVoteResponse === undefined || highestRepPlusVoteResponse === null)
				questionData["SOQuestionData_HighestResponseVotePlusReputation"] 
					= "n/a";
			else
				questionData["SOQuestionData_HighestResponseVotePlusReputation"] 
					= highestRepPlusVoteResponse.owner.reputation + highestRepPlusVoteResponse.score;
		
			var acceptedResponseTime = window.stackExchange.getResponseTimeOfAcceptedAnswerForQuestionId(questionId);
			questionData["SOQuestionData_AcceptedResponseTime"] 
				= acceptedResponseTime;
			
			var bestAnswerResponseTime = window.stackExchange.getResponseTimeOfHighestVotePlusReputationAnswerForQuestionId(questionId);
			questionData["SOQuestionData_BestVotePlusReputationResponseTime"] 
				= bestAnswerResponseTime;
			
			var answerCount = window.stackExchange.getNumberOfAnswersForQuestionId(questionId);
			questionData["SOQuestionData_AnswerCount"] 
				= answerCount;
			
			var viewCount = window.stackExchange.getViewCountForQuestionId(questionId);
			questionData["SOQuestionData_ViewCount"] 
				= viewCount;
			
			var questionVoteCount = window.stackExchange.getNumberOfVotesForQuestionId(questionId);
			questionData["SOQuestionData_QuestionVoteCount"] 
				= questionVoteCount;
			
			var author = window.stackExchange.getAuthorOfQuestionId(questionId);
			questionData["SOQuestionData_QuestionAuthor"] 
				= author;
			
			for (var i = 0; i < responses.length; i++) {
				var addlInfo = responses[i]
				$.each(questionData, function(key, value) {
					addlInfo[key] = value;
				});
				responses[i] = addlInfo;
			}
		});
		
		return results;
	}
	
	var getQuestionIdFromUrl = function(url) {
		var path = url.split("/");
		for (var i = 0; i < path.length; i++) {
			if (path[i] === "questions")
				return path[i+1];
		}
	}
	
});