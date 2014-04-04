$(function() {
	/**
	 * Create a new hit with URL and # of assignments
	 */
	$('#stack_overflow_form').submit(function(e) {
		e.preventDefault();
		// preventing default click action
		
		$("#result").empty();
		$("#hits").empty();
		$("#downloadjson").addClass("hidden");
        
        var numQuestions = $("#questions").val();
        var numAssignments = $("#assignments").val();
        var reward = $("#reward").val();
        
        // (this is blocking)
        var questions = window.stackExchange.getQuestions(numQuestions);
        console.log(questions);
        
        create_hit(questions, numAssignments, reward); 

        // download ALL questions data in 1 file
        downloadQuestionsForHit("myhits", questions);
	});
    
    var downloadQuestionsForHit = (function () {
        return function (hitid, questions) {
            var json = JSON.stringify(questions),
                blob = new Blob([json], {type: "octet/stream"}),
                url = window.URL.createObjectURL(blob);
            $("#downloadjson").attr("href", url);
            $("#downloadjson").attr("download", hitid + ".json");
        };
    }());

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
                
                $("#downloadjson").removeClass("hidden");

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
});