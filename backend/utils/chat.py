import base64
import os
from google import genai
from google.genai import types
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch, UrlContext
from utils.prompt import prompt
from dotenv import load_dotenv
load_dotenv()

message_history = [
        types.Content(
            role="model",
            parts=[
                types.Part.from_text(text=prompt),
            ]
        ),
    ]
LIMIT = 10

scenario_dict = {
    "new-arrival": message_history.copy(),
    "new-baby": message_history.copy(),
    "storm-damage": message_history.copy(),
    "change-address": message_history.copy(),
    "business-registration": message_history.copy(),
}
user_scenarios = {}
scenario_name = None


def delete_message_history(scenario: str):
    global user_scenarios
    for user_id in user_scenarios:
        if scenario in user_scenarios[user_id]:
            user_scenarios[user_id][scenario] = scenario_dict[scenario].copy()

def generate(user_id: str, message: str) -> str:
    client = genai.Client(
        api_key=os.getenv("model_key"),
    )

    if "User requested to clean the chat history for this scenario:" in message:
        scenario = message.split("User requested to clean the chat history for this scenario:")[-1].strip()
        delete_message_history(scenario)
        return "Chat history cleared for scenario: " + scenario

    # Extract scenario name from the first line of the message
    scenario_name_found = None
    first_line = message.split('\n')[0]
    for name in scenario_dict.keys():
        if name in first_line:
            scenario_name_found = name
            break
    if not scenario_name_found:
        return "Error: No valid scenario name found in the message."
    scenario_name = scenario_name_found

    # Ensure user_scenarios[user_id] is a dict
    if user_id not in user_scenarios:
        user_scenarios[user_id] = {}
    if scenario_name not in user_scenarios[user_id]:
        user_scenarios[user_id][scenario_name] = scenario_dict[scenario_name].copy()

    user_scenarios[user_id][scenario_name].append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=message.split('User:')[-1].strip()),
            ]
        ),
    )

    model = "gemini-2.5-flash"
    contents = user_scenarios[user_id][scenario_name]
    # Keep only the last LIMIT messages
    if len(contents) > LIMIT:
        contents = contents[-LIMIT:]
    tools = [
        # types.Tool(googleSearch=types.GoogleSearch(
        # )),
        types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(
            thinking_budget=3798,
        ),
        tools=tools,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )
   
    # print(user_scenarios)
    return response.text


