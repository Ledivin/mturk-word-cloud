/*
 * Copyright (c) 2014 General Electric Company. All rights reserved.
 *
 * The copyright to the computer software herein is the property of
 * General Electric Company. The software may be used and/or copied only
 * with the written permission of General Electric Company or in accordance
 * with the terms and conditions stipulated in the agreement/contract
 * under which the software has been supplied.
 */

package services;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import play.Logger;
import play.libs.Json;

import com.amazonaws.mturk.dataschema.QuestionFormAnswers;
import com.amazonaws.mturk.dataschema.QuestionFormAnswersType;
import com.amazonaws.mturk.requester.Assignment;
import com.amazonaws.mturk.requester.AssignmentStatus;
import com.amazonaws.mturk.requester.HIT;
import com.amazonaws.mturk.service.axis.RequesterService;
import com.amazonaws.mturk.util.PropertiesClientConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * This class acts as an interface to Mechanical Turk
 */
public class MechanicalTurkService {
	private RequesterService service;

	/**
	 * Initialize the Mechanical Turk service
	 */
	public MechanicalTurkService() {
		service = new RequesterService(new PropertiesClientConfig(
				"conf/mturk.properties"));
	}

	public String createHit(String url, int assignments, Double reward) {
		Logger.debug("Creating hit");

		// Workaround for the office proxy
		System.setProperty("http.proxyHost", "");
		System.setProperty("http.proxyPort", "");

		String question = views.html.question.render(url).body().trim();

		HIT hit = service.createHIT(
				"Rate the Quality of this StackOverflow question",
				"Answer questions about a StackOverflow question", reward,
				question, assignments);

		return hit.getHITId();
	}

	public JsonNode getAllHits() {

		ArrayNode allHits = Json.newObject().arrayNode();

		HIT[] hits = service.searchAllHITs();
		for (HIT hit : hits) {

			ObjectNode myHit = Json.newObject();
			myHit.put("hitId", hit.getHITId());
			myHit.put("title", hit.getTitle());
			myHit.put("reward", hit.getReward().getFormattedPrice());
			DateFormat dateFormat = new SimpleDateFormat("MM/dd HH:mm:ss");
			myHit.put("time",
					dateFormat.format(hit.getCreationTime().getTime()));
			myHit.put("url", parseUrlFromQuestion(hit.getQuestion()));

			allHits.add(myHit);
		}

		return allHits;
	}

	private String parseUrlFromQuestion(String question) {
		String questionSubstr = "";
		int start = question.indexOf("<Text>http://stackoverflow");
		if(start != -1) {
			start += 6;
			questionSubstr = question.substring(start);
			int end = questionSubstr.indexOf("</Text>");
			if(end != -1) {
				questionSubstr = questionSubstr.substring(0, end);
			}
		}
		return questionSubstr;
	}

	public ArrayNode getHitResponses(String hitId) {
		
		Assignment[] assignments = service.getAllAssignmentsForHIT(hitId);
		Logger.debug("Found " + assignments.length + " assignments.");
		
		ArrayNode responses = Json.newObject().arrayNode(); 
		
		for (Assignment assignment : assignments) {
			if (isSubmittedOrApproved(assignment)) {
				String answerXML = assignment.getAnswer();

				QuestionFormAnswers questionFormAnswers = RequesterService
						.parseAnswers(answerXML);
				questionFormAnswers.getAnswer();

				@SuppressWarnings("unchecked")
				List<QuestionFormAnswersType.AnswerType> answers = (List<QuestionFormAnswersType.AnswerType>) questionFormAnswers
						.getAnswer();
				
				ObjectNode response = Json.newObject();

				for (QuestionFormAnswersType.AnswerType answerType : answers) {
					String assignmentId = assignment.getAssignmentId();
					String answer = RequesterService.getAnswerValue(assignmentId,
							answerType);

					response.put(answerType.getQuestionIdentifier(), answer);
				}
				
				responses.add(response);
			}
		}

		return responses;
	}

	private boolean isSubmittedOrApproved(Assignment assignment) {
		return assignment.getAssignmentStatus() == AssignmentStatus.Submitted
				|| assignment.getAssignmentStatus() == AssignmentStatus.Approved;
	}


}
