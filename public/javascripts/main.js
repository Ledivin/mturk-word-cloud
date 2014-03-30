$(function() {
	/**
	 * Create a new hit with URL and # of assignments
	 */
	$('#stack_overflow_form').submit(function(e) {
		console.log($('#url').val());
		e.preventDefault();
		// preventing default click action
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
				// TODO: Print URL where they can see the hits
				alert('success ' + JSON.stringify(data));
				console.log('Success: ' + JSON.stringify(data));

				// Set the value of the HIT input box to this data.
				$('#id').val(data.hitId);

				// Open the new HIT in a new window
				window.open(data.hitURL, '_blank');
			},
			error : function(data) {
				alert('ajax failed' + data);
			},
		});
	}
});