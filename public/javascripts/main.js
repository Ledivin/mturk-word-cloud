$(function() {
	/**
	 * Create a new hit with URL and # of assignments
	 */
	$('#stack_overflow_form').submit(function(e) {
		e.preventDefault();
		// preventing default click action
        
        var numQuestions = $("#questions").val();
        var numAssignments = $("#assignments").val();
        var reward = $("#reward").val();
        
        // (this is blocking)
        var questions = window.stackExchange.getQuestions(numQuestions);

        create_hit(questions, numAssignments, reward);
        
//        $.ajax({
//            url: '/questions',
//            type: 'post',
//            dataType: 'json',
//            contentType: 'application/json',
//            data: questions,
//            success : function(data) {
//                console.log("success");
//                console.log(data);
//            },
//            error: function(data) {
//                console.log("error");
//                console.log(data);
//            }
//        });        
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
                
                $("#result").text("Your HIT with the following ID has been generated");
                $("#hitid").text(data.id);
                $("#downloadjson").removeClass("hidden");
        
                downloadQuestionsForHit(data.id, questions);
                
//				// TODO: Print URL where they can see the hits
//				alert('success ' + JSON.stringify(data));
//				console.log('Success: ' + JSON.stringify(data));
//
//				// Set the value of the HIT input box to this data.
//				$('#id').val(data.hitId);

				// Open the new HIT in a new window
				//window.open(data.url, '_blank');
			},
			error : function(data) {
                $("#result").text("The HIT could not be generated.");
                $("#hitid").text(data);

				//alert('ajax failed' + data);
			}
		});
	}
});