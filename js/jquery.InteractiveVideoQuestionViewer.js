var InteractiveVideoQuestionViewer = (function (scope) {
	'use strict';
	var pub = {},
		pro = {};

	pub.QuestionObject = {};

	pub.getQuestionPerAjax = function (comment_id, player) {
		$.when(
				$.ajax({
					url:  scope.InteractiveVideo.question_get_url + '&comment_id=' + comment_id,
					type: 'GET', dataType: 'json'
				})
		).then(function (array) {
			pro.showQuestionInteractionForm(comment_id, array, player);
		});
	};

	pro.buildQuestionForm = function() {
		var modal = $('.modal-body');
		var type  = parseInt(pub.QuestionObject.type, 10);
		modal.html('');
		$('.modal-title').html(pub.QuestionObject.question_title);
		modal.append('<p>' + pub.QuestionObject.question_text + '</p>');
		if (type === 0) {
			pro.addAnswerPossibilities('radio');
			pro.addFeedbackDiv();
			pro.addButtons();
		}
		else if (type === 1){
			pro.addAnswerPossibilities('checkbox');
			pro.addFeedbackDiv();
			pro.addButtons();
		}
		else if (type === 2)
		{
			pro.addSelfReflectionLayout();
		}
		pro.showPreviousAnswer();
	};

	pro.showPreviousAnswer = function()
	{
		if(pub.QuestionObject.feedback !== undefined && pub.QuestionObject.previous_answer !== undefined)
		{
			$.each(pub.QuestionObject.previous_answer, function (l, value) {
				$('#answer_' + value).attr('checked', true);
			});
			if(pub.QuestionObject.type != 2)
			{
				pro.showFeedback(pub.QuestionObject.feedback);
			}
		}
	};

	pro.addAnswerPossibilities = function(input_type) {
		var html = '';
		html = '<form id="question_form">';
		$.each(pub.QuestionObject.answers, function (l, value) {
			html += pro.buildAnswerInputElement(input_type, value);
		});
		html += '<input name="qid" value ="' + pub.QuestionObject.question_id + '" type="hidden"/>';
		html += '</form>';
		$('.modal-body').append(html);
	};

	pro.buildAnswerInputElement = function(input_type, value)
	{
		return  '<label for="answer_'   + value.answer_id + '">' +
			'<input' +
			' id="answer_' + value.answer_id + '" name="answer[]"' +
			' value="'      + value.answer_id + '"' +
			' type="'     + input_type + '">' +
			value.answer +
			'</label>' + 
			'<div class="progress rf_listener response_frequency_' + value.answer_id + ' ilNoDisplay"></div>' +
			'<br/>';
	};

	pro.addSelfReflectionLayout = function() {
		$('.modal-body').append('<div class="modal_feedback">' + pro.createButtonButtons('close_form', scope.InteractiveVideo.lang.close_text) +'</div>');
		pro.appendCloseButtonListener();
		$.ajax({
			type:    "POST",
			cache:   false,
			url:     scope.InteractiveVideo.question_post_url,
			data:    {'qid' : pub.QuestionObject.question_id},
			success: function () {
				pro.addToLocalIgnoreArrayIfNonRepeatable();
			}
		});
	};

	pro.addToLocalIgnoreArrayIfNonRepeatable = function(){
		var repeat = parseInt(InteractiveVideoQuestionViewer.QuestionObject.repeat_question, 10);
		if(repeat === 0)
		{
			scope.InteractiveVideo.ignore_questions.push(pub.comment_id );
		}
	};

	pro.addFeedbackDiv = function() {
		$('#question_form').append('<div class="modal_feedback"></div>');
	};

	pro.addButtons = function() {
		var question_form = $('#question_form');
		question_form.append(pro.createButtonButtons('sendForm', scope.InteractiveVideo.lang.send_text));
		question_form.append(pro.createButtonButtons('close_form', scope.InteractiveVideo.lang.close_text));
		pro.appendButtonListener();
	};

	pro.showFeedback = function(feedback) {
		var modal = $('.modal_feedback');
		modal.html('');
		pro.showResponseFrequency(feedback.response_frequency);
		modal.html(feedback.html);
		if (parseInt(feedback.is_timed, 10) === 1) {
			modal.append('<div class="learning_recommendation"><br/>' + scope.InteractiveVideo.lang.learning_recommendation_text + ': ' + pro.createButtonButtons('jumpToTimeInVideo', scope.InteractiveVideo.lang.feedback_button_text + ' ' + mejs.Utility.secondsToTimeCode(feedback.time)) + '</div>');
			$('#jumpToTimeInVideo').on('click', function (e) {
				$('#ilQuestionModal').modal('hide');
				scope.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(feedback.time);
			});
		}
	};

	pro.showResponseFrequency = function(response_frequency) 
	{
		var answers_count = 0;
		var percentage = 0;
		if(parseInt(pub.QuestionObject.show_response_frequency, 10) === 1)
		{
			$.each(response_frequency, function (l, value) {
				answers_count += parseInt(value, 10);
			});

			$.each($('.rf_listener'), function () {
				$(this).removeClass('ilNoDisplay');
				$(this).html('<div class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">0%</div>');
			});
			$.each(response_frequency, function (l, value) {
				percentage = (value / answers_count) * 100;
				$('.response_frequency_' + l).html('<div class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percentage + '%;">' + percentage + '%</div>');
			});
		}
	};

	pro.appendButtonListener = function() {
		$('#question_form').on('submit', function (e) {
			e.preventDefault();
			$.ajax({
				type:    "POST",
				cache:   false,
				url:     scope.InteractiveVideo.question_post_url,
				data:    $(this).serialize(),
				success: function (feedback) {
					var obj = JSON.parse(feedback);
					pro.showFeedback(obj);
					pro.addToLocalIgnoreArrayIfNonRepeatable();
				}
			});
		});
		pro.appendCloseButtonListener();
	};

	pro.appendCloseButtonListener = function()
	{
		$('#close_form').on('click', function (e) {
			$('#ilQuestionModal').modal('hide');
			scope.InteractiveVideoPlayerAbstract.resumeVideo();
		});
	};

	pro.createButtonButtons = function(id, value) {
		return '<input id="' + id + '" class="btn btn-default btn-sm" value="' + value + '" '+ 'type="submit">';
	};

	pro.showQuestionInteractionForm = function(comment_id, array, player) {
		pub.comment_id = comment_id;
		pub.QuestionObject = array;
		pub.QuestionObject.player = player;
		pro.buildQuestionForm();
		if (pub.QuestionObject.player.isFullScreen === true) {
			pub.QuestionObject.player.exitFullScreen();
		}
		$('#ilQuestionModal').modal('show');
	};
	
	pub.protect = pro;
	return pub;

}(il));
