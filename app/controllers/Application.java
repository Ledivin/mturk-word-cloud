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
    	if(request().body().isMaxSizeExceeded()) {
    		return badRequest("Too much data!");
    	}
    	
        // Get the data from the form
        JsonNode hitRequest = request().body().asJson();
        ArrayNode questions = (ArrayNode) hitRequest.get("questions");
        int assignments = hitRequest.get("assignments").asInt();
        Double reward = hitRequest.get("reward").asDouble();

        Map<String, String> hits = new HashMap<String, String>();
        for(JsonNode question : questions) {
        	String url = question.asText();
            Logger.debug("Creating HIT for: " + url); 
            String id = turk.createHit(url, assignments, reward);
            Logger.debug("Created HIT: " + id);
            hits.put(url, id);
        }

        return ok(toJson(hits));
    }

    public static Result getAllHits() {
    	
    	return ok(turk.getAllHits());
    }
    

    public static Result getResults()
    {	
    	JsonNode hitRequest = request().body().asJson();
        ArrayNode hits = (ArrayNode) hitRequest.get("hits");
        
        ObjectNode results = Json.newObject();
        
        for(int i=0; i<hits.size(); i++) {
        	
        	JsonNode hit = hits.get(i);
        	
        	String hitId = hit.get("id").asText();
        	String url = hit.get("url").asText();
   
        	ArrayNode responses = turk.getHitResponses(hitId);
        	
        	results.put(url, responses);        	
        }
        
        return ok(results);
    }
  
}
