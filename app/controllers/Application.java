package controllers;

import static play.libs.Json.toJson;

import java.util.HashMap;
import java.util.Map;

import play.Logger;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import services.MechanicalTurkService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Main entrance to the application. See conf/routes for mappings between the api and controllers.
 *
 */
public class Application extends Controller
{

    // So we can communicate with Mechanical Turk
    private static MechanicalTurkService turk = new MechanicalTurkService();

    /**
     * Create a hit with the given form data.
     * Expects the form to contain number_of_assignments and a url to judge.
     *
     * @return OK if the HIT was created successfully. BAD_REQUEST otherwise.
     */
    public static Result createHit()
    {
        // Get the data from the form
        JsonNode hitRequest = request().body().asJson();
        ArrayNode questions = (ArrayNode) hitRequest.get("questions");
        int assignments = hitRequest.get("assignments").asInt();
        Double reward = hitRequest.get("reward").asDouble();

        Map<String, String> hits = new HashMap<String, String>();
        for(JsonNode question : questions) {
        	String url = question.get("link").asText();
            Logger.debug("Creating HIT for: " + url); 
            String id = turk.createHit(url, assignments, reward);
            Logger.debug("Created HIT: " + id);
            hits.put(url, id);
        }
        
        //ObjectNode response = Json.newObject();
        
        //hitMap.put("assignments", Integer.toString(assignments));
        //hitMap.put("url", url);

        //
        //response.put("ids", );
        //response.put("url", "www.google.com");
        return ok(toJson(hits));//toJson(hitMap));
    }

    /**
     * Get all words from completed hits. Useful when creating a word cloud. The id of the HIT should be in the query parameters of the request.
     *
     * @return Words for a hitId
     */
    public static Result getWords(String hitId)
    {
        Logger.debug("Got request for words: " + hitId);

        Map<String, Integer> wordCounts = turk.getWordsFromCompletedAssignments(hitId);

        Integer maxCount = 0;
        String maxWord = null;
        for(Map.Entry<String, Integer> word : wordCounts.entrySet()) {
        	if(word.getValue() > maxCount) {
        		maxCount = word.getValue();
        		maxWord = word.getKey();
        	}
        } 
        
        Logger.debug("Total number of accepted words: "+wordCounts.size());
        Logger.debug("Highest frequency: "+maxCount+ " "+maxWord);

        Logger.debug("All words and their frequencies:");
        for(Map.Entry<String, Integer> word : wordCounts.entrySet()) {
        	Logger.debug("    " + word.getKey() + " - " + word.getValue());
        }
        
        ObjectNode response = Json.newObject();
        response.put("wordArray", toJson(wordCounts));
        response.put("maxCount", maxCount);
        
        return ok(response);
    }
  
}
