"""
chat.py — Gemini conversation logic for ServiceChat.

Each (user_id, scenario) pair maintains its own conversation history so that
different users and different scenarios never bleed into each other.
"""

import os
from google import genai
from google.genai import types
from utils.prompt import SCENARIO_PROMPTS
from dotenv import load_dotenv

load_dotenv()

# How many messages to keep per (user, scenario) before trimming oldest.
# The initial system-prompt turn (index 0) is always preserved.
HISTORY_LIMIT = 20

# Per-user, per-scenario history: { user_id: { scenario: [Content, ...] } }
user_scenarios: dict[str, dict[str, list]] = {}


def _make_initial_history(scenario: str) -> list:
    """Return a fresh conversation seed for the given scenario."""
    prompt_text = SCENARIO_PROMPTS.get(scenario, "")
    if not prompt_text:
        return []
    return [
        types.Content(
            role="model",
            parts=[types.Part.from_text(text=prompt_text)],
        )
    ]


def _get_history(user_id: str, scenario: str) -> list:
    """Return (and lazily create) the conversation history for this user+scenario."""
    if user_id not in user_scenarios:
        user_scenarios[user_id] = {}
    if scenario not in user_scenarios[user_id]:
        user_scenarios[user_id][scenario] = _make_initial_history(scenario)
    return user_scenarios[user_id][scenario]


def _trim_history(history: list) -> None:
    """
    Keep the initial system-prompt turn plus the most recent HISTORY_LIMIT messages.
    Modifies the list in-place.
    """
    if len(history) <= HISTORY_LIMIT + 1:
        return
    trimmed = [history[0]] + history[-HISTORY_LIMIT:]
    history.clear()
    history.extend(trimmed)


def delete_message_history(user_id: str, scenario: str) -> None:
    """Reset conversation history for a specific user+scenario."""
    if user_id in user_scenarios and scenario in user_scenarios[user_id]:
        user_scenarios[user_id][scenario] = _make_initial_history(scenario)


def _build_client_and_config():
    client = genai.Client(api_key=os.getenv("model_key"))
    tools = [
        types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch()),
    ]
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=3798),
        tools=tools,
    )
    return client, config


def _parse_message(message: str):
    """Extract (scenario_name, user_text) from a frontend message string."""
    first_line = message.split("\n")[0]
    scenario_name = None
    for name in SCENARIO_PROMPTS:
        if name in first_line:
            scenario_name = name
            break
    user_text = message.split("User:")[-1].strip()
    return scenario_name, user_text


def generate(user_id: str, message: str) -> str:
    """Standard (non-streaming) response generation."""
    if "User requested to clean the chat history for this scenario:" in message:
        scenario = message.split("User requested to clean the chat history for this scenario:")[-1].strip()
        delete_message_history(user_id, scenario)
        return f"Chat history cleared for scenario: {scenario}"

    scenario_name, user_text = _parse_message(message)
    if not scenario_name:
        return "Error: No valid scenario name found in the message."

    history = _get_history(user_id, scenario_name)
    history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_text)]))
    _trim_history(history)

    client, config = _build_client_and_config()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=history,
        config=config,
    )
    reply_text = response.text

    # Save model reply so next turn has full context
    history.append(types.Content(role="model", parts=[types.Part.from_text(text=reply_text)]))
    _trim_history(history)

    return reply_text


def generate_stream(user_id: str, message: str):
    """
    Generator that yields text chunks for SSE streaming.
    Saves the full assembled reply to history once streaming completes.
    """
    if "User requested to clean the chat history for this scenario:" in message:
        scenario = message.split("User requested to clean the chat history for this scenario:")[-1].strip()
        delete_message_history(user_id, scenario)
        yield f"Chat history cleared for scenario: {scenario}"
        return

    scenario_name, user_text = _parse_message(message)
    if not scenario_name:
        yield "Error: No valid scenario name found in the message."
        return

    history = _get_history(user_id, scenario_name)
    history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_text)]))
    _trim_history(history)

    client, config = _build_client_and_config()
    full_reply = ""
    try:
        for chunk in client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=history,
            config=config,
        ):
            if chunk.text:
                full_reply += chunk.text
                yield chunk.text
    except Exception as exc:
        yield f"\n\n[Error: {exc}]"
        return

    # Save complete reply to history
    history.append(types.Content(role="model", parts=[types.Part.from_text(text=full_reply)]))
    _trim_history(history)


def generate_roadmap(user_id: str, scenario_name: str) -> str:
    """
    Ask Gemini to generate a personalised roadmap JSON based on the existing
    conversation history for this user+scenario.

    Returns a JSON string: {"steps": [{"title", "description", "link", "priority", "estimatedTime"}, ...]}
    """
    history = _get_history(user_id, scenario_name)

    roadmap_prompt = (
        "Based on our conversation so far, generate a personalised step-by-step roadmap "
        "for the user to complete all necessary government service tasks.\n\n"
        "Return ONLY a valid JSON object with this exact shape — no markdown fences, no extra text:\n"
        '{"steps": [\n'
        '  {"title": "...", "description": "...", "link": "https://...", '
        '"priority": "high|medium|low", "estimatedTime": "e.g. 15 min"}\n'
        "]}"
    )

    roadmap_history = history + [
        types.Content(role="user", parts=[types.Part.from_text(text=roadmap_prompt)])
    ]

    client = genai.Client(api_key=os.getenv("model_key"))
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=1024),
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=roadmap_history,
        config=config,
    )
    return response.text
