//BEGIN helper for html and karma usage
var path = '';
if (typeof window.__karma__ !== 'undefined') {
	path += 'base/' //used for fixtures in karma
}
else {
	var $j = $; //used for event listeners in karma
}
jasmine.getFixtures().fixturesPath = path + 'spec/javascripts/fixtures';
//END helper for html and karma usage

describe("InteractiveVideoPlayerComments Tests", function () {

	describe("HTML Builder Test Cases", function () {
		beforeEach(function () {
			il.InteractiveVideo = {lang : {send_text : 'send', close_text : 'close',
				learning_recommendation_text : 'Further Information',
				feedback_button_text : 'feedback', private_text : 'private', question_text : 'Question'}};
			il.InteractiveVideo.comments = [];
		});
		afterEach(function () {
		});

		it("InteractiveVideoQuestionCreator object must exists", function () {
			expect(typeof il.InteractiveVideoPlayerComments).toEqual('object');
		});

		it("buildCommentTextHtml must return html", function () {
			var expec = '<span class="comment_text">My little text</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.buildCommentTextHtml('My little text');
			expect(value).toEqual(expec);
		});

		it("buildCommentTitleHtml must return html", function () {
			var expec = '<span class="comment_title">My little text</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.buildCommentTitleHtml('My little text');
			expect(value).toEqual(expec);

			expec = '<span class="comment_title"></span> ';
			value = il.InteractiveVideoPlayerComments.protect.buildCommentTitleHtml(null);
			expect(value).toEqual(expec);
		});

		it("buildCommentUsernameHtml must return html", function () {
			var expec = '<span class="comment_username"> Username</span>';
			var value = il.InteractiveVideoPlayerComments.buildCommentUsernameHtml('Username', 0);
			expect(value).toEqual(expec);

			expec = '<span class="comment_username"> [Question]</span>';
			value = il.InteractiveVideoPlayerComments.buildCommentUsernameHtml('Username', 1);
			expect(value).toEqual(expec);

			expec = '<span class="comment_username"> </span>';
			value = il.InteractiveVideoPlayerComments.buildCommentUsernameHtml('', 0);
			expect(value).toEqual(expec);
		});

		it("builCommentPrivateHtml must return html", function () {
			var expec = '<span class="private_text"> (private)</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.appendPrivateHtml(1);
			expect(value).toEqual(expec);

			expec = '<span class="private_text"></span> ';
			value = il.InteractiveVideoPlayerComments.protect.appendPrivateHtml(0);
			expect(value).toEqual(expec);
		});

		it("buildCommentTextHtml must return html", function () {
			var expec = '<span class="comment_text">61</span> ';
			var value = il.InteractiveVideoPlayerComments.protect.buildCommentTextHtml(61, 0);
			expect(value).toEqual(expec);

			expec = '<time class="time"> <a onClick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(60.9); return false;">00:01:01</a></time>';
			value = value = il.InteractiveVideoPlayerComments.protect.buildCommentTimeHtml(61, 1);
			expect(value).toEqual(expec);
		});

		it("buildCommentTagsHtml must return html", function () {
			var tags = 'Tag1, Tag2';
			var expec = '<div class="comment_tags"><span class="tag">Tag1</span> <span class="tag"> Tag2</span> </div>';
			var value = il.InteractiveVideoPlayerComments.protect.buildCommentTagsHtml(tags);
			expect(value).toEqual(expec);

			expec = '<div class="comment_tags"></div>';
			value = il.InteractiveVideoPlayerComments.protect.buildCommentTagsHtml(null);
			expect(value).toEqual(expec);
		});

		
	});
	describe("Utils Test Cases", function () {
		beforeEach(function () {
			called = false;
			il.InteractiveVideo = {};
			il.InteractiveVideo = {lang : {send_text : 'send', close_text : 'close',
				learning_recommendation_text : 'Further Information', reset_text: 'reset',
				feedback_button_text : 'feedback', private_text : 'private', question_text : 'Question'}};
			il.InteractiveVideo.comments = [];
			il.InteractiveVideo.stopPoints = [];
			callHelper = {
				play: function () {
					called = true;
				},
				pause: function () {
					called = true;
				}
			};
			spyOn(callHelper, 'play');
			spyOn(callHelper, 'pause');

		});

		afterEach(function () {
		});

		it("sliceCommentAndStopPointsInCorrectPosition", function () {
			var expec = [{comment_time: 5}];
			il.InteractiveVideo.comments = [];
			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 5}, 5);
			expect(il.InteractiveVideo.comments).toEqual(expec);

			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 6}, 6);
			expec = [{comment_time: 5}, {comment_time: 6}];
			expect(il.InteractiveVideo.comments).toEqual(expec);

			il.InteractiveVideoPlayerComments.sliceCommentAndStopPointsInCorrectPosition({comment_time: 0}, 0);
			expec = [{comment_time: 5}, {comment_time: 0}, {comment_time: 6}];
			expect(il.InteractiveVideo.comments).toEqual(expec);
		});

		it("replaceCommentsAfterSeeking", function () {
			var expec = '';
			il.InteractiveVideo.comments = [];
			il.InteractiveVideo.is_show_all_active = false;
			il.InteractiveVideo.filter_by_user = false;
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideoPlayerComments.replaceCommentsAfterSeeking(1);
			expect($("#ul_scroll").html()).toEqual(expec);

			expec = '';
			comments = [{comment_time: 5, comment_text: 'Text', is_interactive: 1, comment_tags: null}];
			il.InteractiveVideoPlayerComments.replaceCommentsAfterSeeking(6);
			expect('').toEqual(expec);
		});

		it("isBuildListElementAllowed", function () {
			il.InteractiveVideo.is_show_all_active = true;
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(false);

			il.InteractiveVideo.is_show_all_active = false;
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(false);

			il.InteractiveVideo.filter_by_user = true;
			il.InteractiveVideo.filter_by_user = 'dummy';
			expect(il.InteractiveVideoPlayerComments.protect.isBuildListElementAllowed('dummy')).toEqual(true);
		});

		it("getAllUserWithComment", function () {
			var expec = [];
			expec['my name'] = 'my name';
			il.InteractiveVideo.comments = [{'user_name': 'my name'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);

			expec['my name2'] = 'my name2';
			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);

			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}, {'user_name': 'my name2'}, {'user_name': 'my name2'}];
			expect(il.InteractiveVideoPlayerComments.protect.getAllUserWithComment()).toEqual(expec);
		});

		it("fillCommentsTimeEndBlacklist", function () {
			il.InteractiveVideo.blacklist_time_end = {};
			expect({}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.fillCommentsTimeEndBlacklist('1',1);
			expect({1:[1]}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.fillCommentsTimeEndBlacklist('1',2);
			expect({1:[1,2]}).toEqual(il.InteractiveVideo.blacklist_time_end);
		});

		it("clearCommentsWhereTimeEndEndded", function () {
			il.InteractiveVideo.blacklist_time_end = {1:[2,1]};
			il.InteractiveVideoPlayerComments.clearCommentsWhereTimeEndEndded(0);
			expect({1:[2,1]}).toEqual(il.InteractiveVideo.blacklist_time_end);

			il.InteractiveVideoPlayerComments.clearCommentsWhereTimeEndEndded(2);
			expect({}).toEqual(il.InteractiveVideo.blacklist_time_end);
		});


		it("setCorrectAttributeForTimeInCommentAfterPosting", function () {
			il.InteractiveVideo.comments = [{comment_time_end : 0, comment_id :0}]
			il.InteractiveVideoPlayerComments.protect.setCorrectAttributeForTimeInCommentAfterPosting(0, 60);
			expect([{comment_time_end : 60, comment_id : 0}]).toEqual(il.InteractiveVideo.comments);

			il.InteractiveVideoPlayerComments.protect.setCorrectAttributeForTimeInCommentAfterPosting(1, 60);
			expect([{comment_time_end : 60, comment_id : 0}]).toEqual(il.InteractiveVideo.comments);
		});

		it("getCSSClassForListelement", function () {
			var element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListElement();
			expect(element).toEqual('crow1');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListElement();
			expect(element).toEqual('crow2');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListElement();
			expect(element).toEqual('crow3');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListElement();
			expect(element).toEqual('crow4');

			element = il.InteractiveVideoPlayerComments.protect.getCSSClassForListElement();
			expect(element).toEqual('crow1');
		});

		it("secondsToTimeCode with 00:00", function () {
			var obj = '00:00:00';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(0);
			expect(expec).toEqual(obj);
		});

		it("secondsToTimeCode with 01:00", function () {
			var obj = '00:01:00';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(60);
			expect(expec).toEqual(obj);
		});

		it("secondsToTimeCode with 12:31:21", function () {
			var obj = '12:31:21';
			var expec = il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(217881);
			expect(expec).toEqual(obj);
		});

		it("displayAllCommentsAndDeactivateCommentStream", function () {
			var expec = '<li class="list_item_0 fadeOut crow1"><div class="message-inner"><div class="comment_user_image"><img src="null"></div><div class="comment_user_data"><span class="comment_username"> undefined</span><span class="private_text"></span> <div class="comment_time"><time class="time"> <a onclick="il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(60); return false;">00:01:00</a></time></div></div><div class="comment_inner_text"><span class="comment_title"></span> <span class="comment_text">bla</span> <span class="comment_replies"></span></div></div><div class="comment_tags"></div></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{comment_time : 60, comment_time_end : 0, comment_id :0, comment_text : 'bla', user_id : 6}]
			il.InteractiveVideo.user_image_cache = JSON.stringify({6 : null});
			il.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(false);
			expect($("#ul_scroll").html()).toEqual('');
			expect(il.InteractiveVideo.is_show_all_active).toEqual(false);

			il.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(true);
			expect($("#ul_scroll").html()).toEqual(expec);
			expect(il.InteractiveVideo.is_show_all_active).toEqual(true);
			
		});

		it("buildCommentTimeEndHtml with h m s fields", function () {
			var comment = {comment_time_end_h: 1, comment_time_end_m: 1, comment_time_end_s: 1, comment_id: 0, comment_time_end: 3661};
			il.InteractiveVideo.comments = [comment];
			il.InteractiveVideoPlayerComments.protect.buildCommentTimeEndHtml(comment);
			expect([{comment_time_end_h: 1, comment_time_end_m: 1, comment_time_end_s: 1, comment_id: 0, comment_time_end: 3661}]).toEqual(il.InteractiveVideo.comments);
		});

		it("buildCommentTimeEndHtml with time_end_field", function () {
			var comment = {comment_id :0, comment_time_end: 3661};
			il.InteractiveVideo.comments = [comment];
			il.InteractiveVideoPlayerComments.protect.buildCommentTimeEndHtml(comment);
			expect([{comment_id :0, comment_time_end: 3661}]).toEqual(il.InteractiveVideo.comments);
		});
		
		it("loadAllUserWithCommentsIntoFilterList one user", function () {
			var expec = '<li><a href="#">reset</a></li><li role="separator" class="divider"></li><li><a href="#">my name</a></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{'user_name': 'my name'}];
			il.InteractiveVideoPlayerComments.loadAllUserWithCommentsIntoFilterList();
			expect($('#dropdownMenuInteraktiveList').html()).toEqual(expec);
		});

		it("loadAllUserWithCommentsIntoFilterList two users", function () {
			var expec = '<li><a href="#">reset</a></li><li role="separator" class="divider"></li><li><a href="#">my name</a></li><li><a href="#">my name2</a></li>';
			loadFixtures('InteractiveVideoPlayerComments_fixtures.html');
			il.InteractiveVideo.comments = [{'user_name': 'my name'}, {'user_name': 'my name2'}];
			il.InteractiveVideoPlayerComments.loadAllUserWithCommentsIntoFilterList();
			expect($('#dropdownMenuInteraktiveList').html()).toEqual(expec);
		});

	});

});