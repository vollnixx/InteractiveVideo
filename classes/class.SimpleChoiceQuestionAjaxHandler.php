<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionStatistics.php');
class SimpleChoiceQuestionAjaxHandler {

    /**
     * @param int $qid question_id
     * @return string
     */
    public function getFeedbackForQuestion($qid)
    {
        $scoring  = new SimpleChoiceQuestionScoring();
        $score    = $scoring->getScoreForQuestionOnUserId($qid);
        $feedback = $scoring->getFeedbackByQuestionId($qid);
        $json     = array();
        if(is_array($feedback))
        {
            if($score === 0)
            {
                if($feedback['wrong'] === null)
                {
                    $feedback['wrong'] = '';
                }
				if($feedback['show_wrong_icon'])
				{
					$start_div = '<div class="wrong">';
				}
				else
				{
					$start_div = '<div class="neutral">';
				}
                $json['html']     = $start_div . $feedback['feedback_one_wrong'] . '</div>';
                $json['is_timed'] = $feedback['is_jump_wrong'];
                $json['time']     = $feedback['jump_wrong_ts'];
            }
            else
            {
                if($feedback['correct'] === null)
                {
                    $feedback['correct'] = '';
                }
				if($feedback['show_correct_icon'])
				{
					$start_div = '<div class="correct">';
				}
				else
				{
					$start_div = '<div class="neutral">';
				}
				$json['html']     = $start_div . $feedback['feedback_correct'] . '</div>';
                $json['is_timed'] = $feedback['is_jump_correct'];
                $json['time']     = $feedback['jump_correct_ts'];
            }
        }
        $simple = new SimpleChoiceQuestionStatistics();
        $json['response_frequency'] = $simple->getResponseFrequency((int) $qid);
	    return json_encode($json);
    }

    /**
     * @param int $cid comment_id
     * @return string
     */
    public function getJsonForCommentId($cid)
    {
        /**
         * @var $ilDB   ilDB
         */
        global $ilDB, $ilUser;
        $res = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_question question, 
				  rep_robj_xvid_qus_text answers 
			WHERE question.comment_id = %s 
			AND   question.question_id = answers.question_id',
            array('integer'), array((int)$cid)
        );

        $counter       = 0;
        $question_data = array();
        $question_text = '';
        $question_type = 0;
        $question_id   = 0;
        while($row = $ilDB->fetchAssoc($res))
        {
            $question_data[$counter]['answer']    = $row['answer'];
            $question_data[$counter]['answer_id'] = $row['answer_id'];
            //$question_data[$counter]['correct']   = $row['correct'];
            $question_text                        = $row['question_text'];
            $question_type                        = $row['type'];
            $question_id                          = $row['question_id'];
            $limit_attempts                       = $row['limit_attempts'];
			$show_correct_icon                    = $row['show_correct_icon'];
            $is_jump_correct                      = $row['is_jump_correct'];
			$show_wrong_icon                      = $row['show_wrong_icon'];
            $jump_correct_ts                      = $row['jump_correct_ts'];
            $is_jump_wrong                        = $row['is_jump_wrong'];
            $jump_wrong_ts                        = $row['jump_wrong_ts'];
			$show_response_frequency              = $row['show_response_frequency'];
            $repeat_question                      = $row['repeat_question'];
            $counter++;
        }

	    $res = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_answers
			WHERE question_id = %s 
			AND   user_id = %s',
		    array('integer', 'integer'), array($question_id, $ilUser->getId())
	    );
	    $counter       = 0;
	    $answered = array();
	    while($row = $ilDB->fetchAssoc($res))
	    {
		    $answered[$counter] = $row['answer_id'];
		    $counter++;
	    }
        $build_json = array();
        //$build_json['title'] 		  = $question_data;
        $build_json['answers']         = $question_data;
        $build_json['question_text']   = $question_text;
        $build_json['type']            = $question_type;
        $build_json['question_id']     = $question_id;
        $simple_choice                 = new SimpleChoiceQuestion();
        $build_json['question_title']  = $simple_choice->getCommentTitleByCommentId($cid);
        $build_json['limit_attempts']  = $limit_attempts;
        $build_json['is_jump_correct'] = $is_jump_correct;
		$build_json['show_correct_icon'] = $show_correct_icon;
        $build_json['jump_correct_ts'] = $jump_correct_ts;
		$build_json['show_wrong_icon'] = $show_wrong_icon;
        $build_json['is_jump_wrong']   = $is_jump_wrong;
        $build_json['jump_wrong_ts']   = $jump_wrong_ts;
		$build_json['show_response_frequency']   = $show_response_frequency;
        $build_json['repeat_question'] = $repeat_question;
	    
	    if( sizeof($answered) > 0)
	    {
		    $build_json['previous_answer'] = $answered;
		    $build_json['feedback']        = json_decode(self::getFeedbackForQuestion($question_id));
	    }
	    
        return json_encode($build_json);
    }

    /**
     * @param $qid
     * @return string
     */
    public function getJsonForQuestionId($qid)
    {
        /**
         * @var $ilDB   ilDB
         */
        global $ilDB;

        $res = $ilDB->queryF('SELECT answer_id, answer, correct FROM rep_robj_xvid_qus_text WHERE question_id = %s',
            array('integer'), array((int)$qid));

	    $question_data = array();
        while($row = $ilDB->fetchAssoc($res))
        {
            $question_data[] = $row;
        }
		if(count($question_data) === 0)
		{
			$question_data[] = '';
		}
        return json_encode($question_data);
    }
}