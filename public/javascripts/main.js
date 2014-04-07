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
				downloadHitResults(data);
			},
			error : function(data) {
				
				console.log("error");
				console.log(data);
			}
		});
		
	}
	
	
});