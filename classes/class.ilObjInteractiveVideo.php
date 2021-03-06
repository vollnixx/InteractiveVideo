<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPlugin.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObject.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');

/**
 * Class ilObjInteractiveVideo
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideo extends ilObjectPlugin
{
	/**
	 * @var bool
	 */
	protected $is_online = false;
	
	/**
	 * @var integer
	 */
	protected $mob_id = 0;

	/**
	 * @var int
	 */
	protected $is_anonymized = 0;
	/**
	 * @var int
	 */
	protected $is_repeat = 0;

	/**
	 * @var int
	 */
	protected $is_chronologic = 0;
	/**
	 * @var int
	 */
	protected $is_public = 0;

	/**
	 * 
	 */
	protected function doRead()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);

		$this->setMobId($row['mob_id']);
		$this->setIsAnonymized($row['is_anonymized']);
		$this->setIsRepeat($row['is_repeat']);
		$this->setIsPublic($row['is_public']);
		$this->setOnline((bool)$row['is_online']);
		$this->setIsChronologic($row['is_chronologic']);

		parent::doRead();
	}

	/**
	 * @param $status
	 */
	public function setOnline($status)
	{
		$this->is_online = (bool)$status;
	}

	/**
	 * @return bool
	 */
	public function isOnline()
	{
		return (bool)$this->is_online;
	}
	
	/**
	 * @return bool
	 * @throws ilException
	 */
	protected function beforeCreate()
	{
		return true;
	}

	protected function beforeCloneObject()
	{
		return true;
	}
	/**
	 * 
	 */
	protected function doCreate()
	{
		/**
		 * @var $ilLog ilLog
		 */
		global $ilLog;
		
		try
		{
			$this->uploadVideoFile();

			parent::doCreate();

			$this->createMetaData();
		}
		catch(Exception $e)
		{
			$ilLog->write($e->getMessage());
			$ilLog->logStack();

			$this->delete();

			throw new ilException(sprintf("%s: Creation incomplete", __METHOD__));
		}
	}

	/**
	 *
	 */
	protected function doUpdate()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		parent::doUpdate();
		
		$this->updateMetaData();
		
		$ilDB->update('rep_robj_xvid_objects',
			array(	'is_anonymized' => array('integer', $this->isAnonymized()), 
				  	'is_repeat' =>array('integer', $this->isRepeat()),
				  	'is_public' =>array('integer', $this->isPublic()),
					'is_chronologic' =>array('integer', $this->isChronologic()),
					'is_online' => array('integer', $this->isOnline())
					),
			array('obj_id' => array('integer', $this->getId())));
	}

	/**
	 * 
	 */
	public function beforeDelete()
	{
		$mob = new ilObjMediaObject($this->getMobId());
		ilObjMediaObject::_removeUsage($this->getMobId(), $this->getType(), $this->getId());
		$mob->delete();
		self::deleteComments(self::getCommentIdsByObjId($this->getId(), false));
	}

	/**
	 * 
	 */
	protected function doDelete()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_objects WHERE obj_id = ' . $ilDB->quote($this->getId(), 'integer'));

		parent::doDelete();

		$this->deleteMetaData();
	}

	/**
	 * @param self    $new_obj
	 * @param integer $a_target_id
	 * @param integer $a_copy_id
	 */
	protected function doCloneObject(ilObjInteractiveVideo $new_obj, $a_target_id, $a_copy_id = null)
	{
		parent::doCloneObject($new_obj, $a_target_id, $a_copy_id);

		$this->cloneMetaData($new_obj);

		global $ilDB;

		$mob = new ilObjMediaObject($this->mob_id);
		$new_mob = $mob->duplicate();
		
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'), array($new_obj->getId()));

		$ilDB->insert(
			'rep_robj_xvid_objects',
			array(
				'obj_id'        => array('integer', $new_obj->getId()),
				'mob_id'        => array('integer', $new_mob->getId()),
				'is_anonymized' => array('integer', $this->isAnonymized()),
				'is_repeat' => array('integer', $this->isRepeat()),
				'is_chronologic' => array('integer', $this->isChronologic()),
				'is_public'     => array('integer', $this->isPublic())
			)
		);

		ilObjMediaObject::_saveUsage( $new_mob->getId(), $this->getType(), $new_obj->getId());
		$comment = new ilObjComment();
		$comment->cloneTutorComments($this->getId(), $new_obj->getId());
	}

	/**
	 *
	 */
	protected function initType()
	{
		$this->setType('xvid');
	}

	/**
	 * delete
	 * @param array $comment_ids
	 * @return bool
	 */
	public function deleteComments($comment_ids)
	{
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$question_ids = self::getQuestionIdsByCommentIds($comment_ids);
		SimpleChoiceQuestion::deleteQuestions($question_ids);
		
		$ilDB->manipulate('DELETE FROM rep_robj_xvid_comments WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}


	/**
	 * @param $comment_ids
	 * @return array
	 */
	public static function getQuestionIdsByCommentIds($comment_ids)
	{
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$question_ids = array();

		$res = $ilDB->query('SELECT question_id FROM rep_robj_xvid_question WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}
		return $question_ids;
	}

	/**
	 * @return array
	 */
	public function getCommentsTableData()
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_comments 
			WHERE obj_id = %s
			AND is_private = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer'), array($this->getId(),0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']			= $row['comment_id'];
			$table_data[$counter]['comment_time']		= $row['comment_time'];
			$table_data[$counter]['comment_time_end']	= $row['comment_time_end'];
			$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['title']				= $row['comment_title'];
			$table_data[$counter]['comment_text']		= $row['comment_text'];
			$table_data[$counter]['is_tutor']			= $row['is_tutor'];
			$table_data[$counter]['is_interactive']		= $row['is_interactive'];
			$counter++;
		}

		return $table_data;

	}

	/**
	 * @return array
	 */
	public function getCommentsTableDataByUserId()
	{
		global $ilDB, $ilUser;

		$res = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_comments 
			WHERE obj_id = %s
			AND user_id = %s
			AND is_interactive = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer', 'integer'), 
			array($this->getId(), $ilUser->getId(), 0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']			= $row['comment_id'];
			$table_data[$counter]['comment_time']		= $row['comment_time'];
			$table_data[$counter]['comment_time_end']	= $row['comment_time_end'];
		//	$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['comment_text']		= $row['comment_text'];
			$table_data[$counter]['is_private']			= $row['is_private'];
//			$table_data[$counter]['is_tutor']       = $row['is_tutor'];
//			$table_data[$counter]['is_interactive'] = $row['is_interactive'];
			$counter++;
		}

		return $table_data;
	}

	/**
	 * @param $comment_id
	 * @return mixed
	 */
	public function getCommentDataById($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		return $row;

	}

	/**
	 * @param $comment_id
	 * @return mixed
	 */
	public function getQuestionDataById($comment_id)
	{
		global $ilDB;
		
		$res = 	$ilDB->queryF('SELECT * FROM rep_robj_xvid_question WHERE comment_id = %s',
			array('integer'), array($comment_id));
		
		$row = $ilDB->fetchAssoc($res);
		$data['question_data'] = $row;

		return $data;
	}

	/**
	 * @param $comment_id
	 * @return string
	 */
	public function getCommentTextById($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT comment_text FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		return (string)$row['comment_text'];
	}

	/**
	 * @param      $obj_id
	 * @param bool $with_user_id
	 * @return array
	 */
	public function getCommentIdsByObjId($obj_id, $with_user_id = true)
	{
		global $ilDB;
		
		$comment_ids = array();
		$res = $ilDB->queryF('SELECT comment_id, user_id FROM rep_robj_xvid_comments WHERE obj_id = %s',
			array('integer'), array($obj_id));
		
		while($row = $ilDB->fetchAssoc($res))
		{
			if($with_user_id == true)
			{
				$comment_ids[$row['comment_id']] = $row['user_id'];
			}
			else
			{
				$comment_ids[] = $row['comment_id'];
			}
		}
		return $comment_ids;
	}

	/**
	 * @throws ilException
	 */
	public function uploadVideoFile()
	{
		global $ilDB, $ilCtrl;

		
		
		if(!isset($_FILES) || !is_array($_FILES)|| !isset($_FILES['video_file']))
		{
			$cmd = $ilCtrl->getCmd();
			if($cmd == 'saveTarget')
			{
				// doClone .. 
				return true;
			} 
			else
			{
				throw new ilException(sprintf("%s: Missing file", __METHOD__));
			}	 
		}
		
		$new_file = $_FILES['video_file'];

		$mob = new ilObjMediaObject();
		$mob->setTitle($new_file['name']);
		$mob->setDescription('');
		$mob->create();

		$mob->createDirectory();
		$mob_dir = ilObjMediaObject::_getDirectory($mob->getId());

		$media_item = new ilMediaItem();
		$mob->addMediaItem($media_item);
		$media_item->setPurpose('Standard');

		$file_name = ilObjMediaObject::fixFilename($new_file['name']);
		$file      = $mob_dir . '/' . $file_name;
		ilUtil::moveUploadedFile($new_file['tmp_name'], $file_name, $file);

		// get mime type
		$format   = ilObjMediaObject::getMimeType($file);
		$location = $file_name;

		// set real meta and object data
		$media_item->setFormat($format);
		$media_item->setLocation($location);
		$media_item->setLocationType('LocalFile');

		$mob->setDescription($format);
		$media_item->setHAlign("Left");

		ilUtil::renameExecutables($mob_dir);
		$mob->update();

		$this->setMobId($mob->getId());
		ilObjMediaObject::_saveUsage( $mob->getId(), $this->getType(), $this->getId());

		if(!$mob->getMediaItem('Standard'))
		{
			throw new ilException(sprintf("%s: No standard media item given", __METHOD__));
		}

		$format = $mob->getMediaItem('Standard')->getFormat();
		if(strpos($format, 'video') === false && strpos($format, 'audio') === false)
		{
			throw new ilException(sprintf("%s: No audio/video file given", __METHOD__));
		}

		//delete old mob-data 
		$res = $ilDB->queryF('SELECT mob_id FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'), array($this->getId()));
		$old_mob_ids = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$old_mob_ids[] = $row['mob_id'];
		}
			
		foreach($old_mob_ids as $mob_id)
		{
			$old_mob = new ilObjMediaObject($mob_id);
			$old_mob->delete();
			ilObjMediaObject::_removeUsage($mob->getId(), $this->getType(), $this->getId());
		}	
			
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'), array($this->getId()));
		
		$ilDB->insert(
			'rep_robj_xvid_objects',
			array(
				'obj_id'        => array('integer', $this->getId()),
				'mob_id'        => array('integer', $this->getMobId()),
				'is_anonymized' => array('integer', (int) $_POST['is_anonymized']),
				'is_repeat' 	=> array('integer', (int) $_POST['is_repeat']),
				'is_chronologic'=> array('integer', (int) $_POST['is_chronologic']),
				'is_public'     => array('integer', (int) $_POST['is_public'])
			)
		);
	}
	
	################## SETTER & GETTER ##################

	/**
	 * @return int
	 */
	public function getMobId()
	{
		return $this->mob_id;
	}

	/**
	 * @param int $mob_id
	 */
	public function setMobId($mob_id)
	{
		$this->mob_id = $mob_id;
	}

	/**
	 * @return int
	 */
	public function isAnonymized()
	{
		return $this->is_anonymized;
	}

	/**
	 * @param int $is_anonymized
	 */
	public function setIsAnonymized($is_anonymized)
	{
		$this->is_anonymized = $is_anonymized;
	}

	/**
	 * @return int
	 */
	public function isRepeat()
	{
		return $this->is_repeat;
	}

	/**
	 * @param int $is_repeat
	 */
	public function setIsRepeat($is_repeat)
	{
		$this->is_repeat = $is_repeat;
	}

	/**
	 * @return int
	 */
	public function isChronologic()
	{
		return $this->is_chronologic;
	}

	/**
	 * @param int $is_chronologic
	 */
	public function setIsChronologic($is_chronologic)
	{
		$this->is_chronologic = $is_chronologic;
	}

	/**
	 * @return int
	 */
	public function isPublic()
	{
		return $this->is_public;
	}

	/**
	 * @param int $is_public
	 */
	public function setIsPublic($is_public)
	{
		$this->is_public = $is_public;
	}
}
