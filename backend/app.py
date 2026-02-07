from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from sentiment_model import predict_emotion_and_sentiment
import jwt
import datetime

import os

import mysql.connector
from mysql.connector import pooling

# Create connection pool to handle multiple concurrent requests
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "chatbot_db",
    "port": 9900,
    "pool_name": "mypool",
    "pool_size": 10,
    "pool_reset_session": True,
    "autocommit": False
}

try:
    connection_pool = pooling.MySQLConnectionPool(**db_config)
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    connection_pool = None

def get_db_connection():
    """Get a connection from the pool"""
    try:
        if connection_pool:
            return connection_pool.get_connection()
        else:
            # Fallback to direct connection if pool fails
            return mysql.connector.connect(
                host="localhost",
                user="root",
                password="1234",
                database="chatbot_db",
                port=9900
            )
    except mysql.connector.Error as err:
        print(f"Error getting connection: {err}")
        raise

def ensure_db_connection():
    """Legacy function for backward compatibility - now uses pool"""
    global db, cursor
    try:
        # Ping the database to check if connection is alive
        db.ping(reconnect=True, attempts=3, delay=1)
    except (mysql.connector.Error, AttributeError):
        # Reconnect if connection is lost
        try:
            db = get_db_connection()
            cursor = db.cursor()
        except mysql.connector.Error as err:
            print(f"Database connection failed: {err}")
            raise

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Add to .env

# Initialize database connection from pool
db = get_db_connection()
cursor = db.cursor()

# Emotion labels
emotion_map = ["Anger","Disgust","Fear","Joy","Neutral","Sadness","Surprise"]

# Map emotions → sentiment
emotion_to_sentiment = {
    "Joy": "Positive",
    "Surprise": "Positive",
    "Neutral": "Neutral",
    "Anger": "Negative",
    "Disgust": "Negative",
    "Fear": "Negative",
    "Sadness": "Negative"
}

def verify_token():
    token = request.headers.get('Authorization')
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

@app.route("/", methods=["GET"])
def home():
    ensure_db_connection()
    try:
        cursor.execute("SELECT 1")
        return {"status": "Backend running! MySQL connected."}
    except Exception as e:
        return {"status": f"Backend running! MySQL error: {str(e)}"}

@app.route("/api/chat", methods=["POST"])
def chat():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    user_message = data.get("text", "")
    emojis = data.get("emojis", [])
    intensity = data.get("intensity", 50)
    conversation_id = data.get("conversation_id")

    # If no conversation_id provided, create a new conversation
    if not conversation_id:
        ensure_db_connection()
        cursor.execute("INSERT INTO conversations (user_id, title) VALUES (%s, %s)", (user_id, "New Chat"))
        conversation_id = cursor.lastrowid
        db.commit()

    # Get user profile for personalization
    ensure_db_connection()
    cursor.execute("SELECT name, gender, course, education_level, race FROM users WHERE id = %s", (user_id,))
    user_row = cursor.fetchone()
    user_profile = {
        "name": user_row[0] if user_row else "Student",
        "gender": user_row[1] if user_row and user_row[1] else "unknown",
        "course": user_row[2] if user_row and user_row[2] else "unknown",
        "education_level": user_row[3] if user_row and user_row[3] else "university",
        "race": user_row[4] if user_row and user_row[4] else "unknown"
    }

    try:
        # --- Build enriched text for better emotion detection ---
        enriched_text = user_message

        # Add emojis if selected
        if emojis:
            enriched_text += " " + " ".join(emojis)

        # Add intensity context
        if intensity < 33:
            enriched_text += " (emotion intensity: low)"
        elif intensity > 66:
            enriched_text += " (emotion intensity: high)"

        # --- Predict emotion using enriched text ---
        emotion, sentiment = predict_emotion_and_sentiment(enriched_text)

        # Map emotion to sentiment if needed
        sentiment = emotion_to_sentiment.get(emotion, sentiment)

        # --- Generate chatbot reply with personalized system prompt ---
        system_prompt = f"""
You are an advanced emotional support AI for students. Your responses MUST feel natural and conversational—exactly like ChatGPT or Gemini.

CRITICAL FORMATTING RULE: NEVER use numbered lists (1., 2., 3.) or bullet points (•, -, *). ONLY use natural paragraphs with line breaks.

═══════════════════════════════════════════════════════════════════════

STUDENT PROFILE:
• Name: {user_profile['name']}
• Gender: {user_profile['gender']}
• Course: {user_profile['course']}
• Education Level: {user_profile['education_level']}

CURRENT EMOTIONAL STATE:
• Detected Emotion: {emotion}
• Sentiment: {sentiment}

═══════════════════════════════════════════════════════════════════════

HOW TO RESPOND (CRITICAL - READ CAREFULLY):

1. CONVERSATIONAL FLOW
   You have access to the FULL conversation history. Build on it naturally!
   
   ✅ If they agree to something you suggested, acknowledge and continue
   ✅ Reference what was discussed earlier
   ✅ Let the conversation flow organically
   
   ❌ DON'T reset with "What would you like to focus on?"
   ❌ DON'T treat each message as isolated
   ❌ DON'T ask the same question twice

2. GENDER-AWARE RESPONSES
   
   For MALE students ({user_profile['gender']}):
   • Often prefer practical, action-oriented advice
   • May struggle to express vulnerability
   • Validate that it's okay to feel emotions
   • Use phrases like "It takes strength to acknowledge this"
   
   For FEMALE students:
   • Often appreciate emotional validation first
   • May benefit from empathetic listening
   • Be aware of perfectionism pressures
   • Use phrases like "Your feelings are completely valid"
   
   For NON-BINARY/OTHER:
   • Be especially affirming and inclusive
   • Avoid gendered assumptions
   • Create a safe, judgment-free space

3. FORMATTING - THIS IS CRITICAL!
   
   DEFAULT: Use natural paragraphs (like Gemini/ChatGPT)
   EXCEPTION: If the user EXPLICITLY asks for a list, numbered steps, or bullet points, provide them.
   
   Examples of when to use lists:
   ✅ "Can you give me a list of study tips?"
   ✅ "What are 5 ways to reduce stress?"
   ✅ "Give me steps to improve my sleep"
   ✅ "Can you number the things I should do?"
   
   Examples of when NOT to use lists (default to paragraphs):
   ❌ "I feel tired and sad" (they didn't ask for a list)
   ❌ "How can I feel better?" (general question, use natural flow)
   ❌ "I'm stressed about exams" (emotional support, not a list request)
   
   ❌ BAD (Unsolicited numbered list):
   "Here are some tips: 1. Take a break 2. Get rest 3. Relax"
   "1. **Take a Break**: Even a few minutes..."
   
   ✅ GOOD (Natural paragraphs - DEFAULT):
   "I'm really sorry you're feeling this way. It's tough to manage everything, especially in computer science. 
   
   How about taking a short break? Even a few minutes to step away can be refreshing. Maybe listen to some music or do a quick stretching routine.
   
   Also, sometimes feeling tired can come from not finding the right balance in tasks. Are there specific subjects or assignments feeling heavier? What do you think might help you recharge a bit today?"
   
   ✅ ALSO GOOD (When user asks for a list):
   User: "Can you give me 5 study tips?"
   Bot: "Absolutely! Here are 5 study tips that can help:
   
   1. **Pomodoro Technique**: Study for 25 minutes, then take a 5-minute break
   2. **Active Recall**: Test yourself instead of just re-reading notes
   3. **Spaced Repetition**: Review material at increasing intervals
   4. **Study Environment**: Find a quiet, dedicated space
   5. **Sleep Well**: Get 7-8 hours—your brain consolidates learning during sleep
   
   Which of these sounds most helpful for your current situation?"

4. RESPONSE STRUCTURE (60-120 words)
   
   Write in 2-3 natural paragraphs separated by blank lines:
   
   Paragraph 1: Empathy + understanding their situation
   
   Paragraph 2: Specific advice or support (NO LISTS!)
   
   Paragraph 3: Thoughtful follow-up question
   
   Use line breaks (\n\n) between paragraphs for readability.

5. EMOTION-SPECIFIC STYLES

   SADNESS/NEGATIVE:
   Start with validation, offer gentle support, ask what's weighing on them.
   
   Example: "I'm really sorry you're going through this. Feeling exhausted from studying is so real, especially in {user_profile['course']}.
   
   Have you been able to take any breaks, or has it been non-stop? Sometimes even a short walk or quick nap can help reset your energy. What do you think would feel most helpful right now?"

   JOY/POSITIVE:
   Match their energy, celebrate genuinely, ask what worked.
   
   Example: "That's awesome! 🎉 Sounds like your hard work is really paying off.
   
   What do you think made the difference this time? It's great to see you feeling positive about your progress!"

   ANXIETY/FEAR:
   Be calming, break things down, offer concrete next steps.
   
   Example: "Overthinking can spiral so quickly, I totally get it. Let's tackle this one piece at a time.
   
   What's the most pressing thing on your mind right now? Sometimes just naming it can help reduce the overwhelm."

   ANGER/FRUSTRATION:
   Validate without judgment, help them process.
   
   Example: "That frustration makes total sense. When things feel unfair or out of your control, it's natural to feel angry.
   
   What happened that triggered this? Let's talk through it together."

   NEUTRAL:
   Be helpful and conversational.
   
   Example: "Sure, I'm here to help! What's on your mind today?"

6. WHAT MAKES IT FEEL LIKE GEMINI/CHATGPT
   
   ✅ Natural, flowing paragraphs (NOT lists)
   ✅ Conversational tone (like texting a friend)
   ✅ Reference specific details they mentioned
   ✅ Use their name occasionally
   ✅ Show you remember the conversation
   ✅ Ask thoughtful follow-up questions
   
   ❌ Numbered lists or bullet points in responses
   ❌ Bold headers like "**Take a Break**:"
   ❌ Clinical language ("I'm sensing...")
   ❌ Generic advice that could apply to anyone
   ❌ Repetitive opening phrases

7. CRISIS PROTOCOL
   If they mention self-harm, suicide, or immediate danger:
   Respond with gentle concern and suggest professional resources.
   
   Otherwise, focus on emotional support and practical guidance.

═══════════════════════════════════════════════════════════════════════

EXAMPLE RESPONSES (STUDY THESE CAREFULLY):

User (male, sad): "I feel really tired this day and it make me so sad"

❌ BAD (Uses numbered list):
"It sounds like you're feeling tired and sad. Here are some tips: 1. **Take a Break**: Even a few minutes to step away can be refreshing. 2. **Reflect on Your Workload**: Sometimes feeling tired comes from not finding balance."

✅ GOOD (Natural paragraphs):
"I'm really sorry you're feeling this way, {user_profile['name']}. It's tough to manage everything, especially in a demanding field like computer science. Feeling worn out and sad is valid, and it's okay to acknowledge that.

How about considering these options? Taking a short break—even a few minutes to step away—can be refreshing. Maybe listen to some music or do a quick stretching routine. Also, sometimes feeling tired can come from not finding the right balance in tasks.

Are there specific subjects or assignments feeling heavier? What do you think might help you recharge a bit today?"

---

User (continuing conversation): "yes"

❌ BAD (Resets conversation):
"Great! What would you like to focus on today?"

✅ GOOD (Continues flow):
"Awesome! Let's start with that 5-minute break idea. Set a timer, step away from your desk, and do something completely different—stretch, grab a snack, or just look out the window.

After that, we can talk about balancing your workload if you want. Sound good?"

═══════════════════════════════════════════════════════════════════════

FINAL REMINDER: 
- DEFAULT: Write in NATURAL PARAGRAPHS (like Gemini/ChatGPT)
- EXCEPTION: Use numbered lists/bullets ONLY if user explicitly asks for them
- Separate ideas with blank lines
- Be conversational and flowing
- Build on conversation history

You're having a CONVERSATION, not writing a manual. Be natural, contextual, and genuinely helpful.
"""

        # Get recent conversation history for context (last 5 exchanges)
        ensure_db_connection()
        cursor.execute(
            "SELECT message_type, content FROM chat_logs WHERE user_id = %s AND conversation_id = %s ORDER BY timestamp DESC LIMIT 10",
            (user_id, conversation_id)
        )
        history_rows = cursor.fetchall()
        
        # Build conversation history (reverse to get chronological order)
        conversation_history = []
        for row in reversed(history_rows):
            msg_type, content = row
            role = "assistant" if msg_type == "bot" else "user"
            conversation_history.append({"role": role, "content": content})

        # Build messages array with history
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)  # Add conversation context
        messages.append({"role": "user", "content": user_message})  # Add current message

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )

        bot_reply = response.choices[0].message.content


        # Save user checkin
        ensure_db_connection()
        now = datetime.datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M:%S")
        cursor.execute(
            "INSERT INTO checkins (user_id, date, time, emotion, sentiment, emoji) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, date_str, time_str, emotion, sentiment, emojis[0] if emojis else None)
        )

        # Save chat logs
        ensure_db_connection()
        cursor.execute(
            "INSERT INTO chat_logs (user_id, message_type, content, emotion, sentiment, conversation_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, 'user', user_message, emotion, sentiment, conversation_id)
        )
        ensure_db_connection()
        cursor.execute(
            "INSERT INTO chat_logs (user_id, message_type, content, conversation_id) VALUES (%s, %s, %s, %s)",
            (user_id, 'bot', bot_reply, conversation_id)
        )

        # Update conversation timestamp
        ensure_db_connection()
        cursor.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (conversation_id,))

        db.commit()

        # --- Auto-Rename Conversation if it's a "New Chat" ---
        ensure_db_connection()
        cursor.execute("SELECT title FROM conversations WHERE id = %s", (conversation_id,))
        row = cursor.fetchone()
        if row and row[0] == "New Chat":
            try:
                title_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Generate a very concise (3-5 words) title for this conversation based on the first message. No quotes."},
                        {"role": "user", "content": f"User: {user_message}"}
                    ],


                )
                new_title = title_response.choices[0].message.content.strip().replace('"', '')
                cursor.execute("UPDATE conversations SET title = %s WHERE id = %s", (new_title, conversation_id))
                db.commit()
            except Exception as e:
                print(f"Auto-rename failed: {e}")

        return jsonify({
            "reply": bot_reply,    
            "emotion": emotion,    
            "sentiment": sentiment
        })

    except Exception as e:
        print("Backend error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    course = (data.get("course") or "").strip()
    gender = (data.get("gender") or "").strip()
    date_of_birth = data.get("date_of_birth")
    education_level = (data.get("education_level") or "").strip()
    race = (data.get("race") or "").strip()

    if not all([name, email, password, course, gender, date_of_birth, education_level, race]):
        return jsonify({"message": "All fields are required"}), 400

    ensure_db_connection()
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"message": "Email already registered"}), 400

    password_hash = generate_password_hash(password)
    ensure_db_connection()
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, course, gender, date_of_birth, education_level, race) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (name, email, password_hash, course, gender, date_of_birth, education_level, race),
    )
    db.commit()
    return jsonify({"message": "Registered"}), 201


@app.route("/api/checkins", methods=["GET"])
def get_checkins():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ensure_db_connection()
    cursor.execute("SELECT id, date, time, emotion, sentiment, emoji FROM checkins WHERE user_id = %s ORDER BY date DESC, time DESC", (user_id,))
    rows = cursor.fetchall()
    checkins = [{"id": r[0], "date": str(r[1]), "time": str(r[2]), "emotion": r[3], "sentiment": r[4], "emoji": r[5]} for r in rows]
    return jsonify(checkins)


@app.route("/api/chat_logs", methods=["GET"])
def get_chat_logs():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conversation_id = request.args.get('conversation_id')
    if conversation_id:
        # Get logs for specific conversation
        ensure_db_connection()
        cursor.execute("SELECT id, message_type, content, emotion, sentiment, timestamp FROM chat_logs WHERE user_id = %s AND conversation_id = %s ORDER BY timestamp ASC", (user_id, conversation_id))
    else:
        # Get all logs (for backward compatibility)
        ensure_db_connection()
        cursor.execute("SELECT id, message_type, content, emotion, sentiment, timestamp FROM chat_logs WHERE user_id = %s ORDER BY timestamp ASC", (user_id,))

    rows = cursor.fetchall()
    logs = [{"id": r[0], "type": r[1], "content": r[2], "emotion": r[3], "sentiment": r[4], "timestamp": str(r[5])} for r in rows]
    return jsonify(logs)


@app.route("/api/insight", methods=["GET"])
def get_insight():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ensure_db_connection()
    # Fetch recent checkins for comprehensive analysis (last 30 days)
    cursor.execute("SELECT date, time, emotion, sentiment FROM checkins WHERE user_id = %s ORDER BY date DESC, time DESC LIMIT 50", (user_id,))
    rows = cursor.fetchall()

    if not rows:
        return jsonify({
            "insight": "Start tracking your emotions to see personalized AI insights here!",
            "patterns": {},
            "motivation": "Welcome! Begin your emotional wellness journey today."
        })

    # Calculate emotional patterns
    from collections import Counter
    emotions = [r[2] for r in rows]
    sentiments = [r[3] for r in rows]
    
    emotion_counts = Counter(emotions)
    sentiment_counts = Counter(sentiments)
    
    total_checkins = len(rows)
    positive_count = sentiment_counts.get("Positive", 0)
    neutral_count = sentiment_counts.get("Neutral", 0)
    negative_count = sentiment_counts.get("Negative", 0)
    
    # Calculate percentages
    positive_percent = round((positive_count / total_checkins) * 100, 1)
    neutral_percent = round((neutral_count / total_checkins) * 100, 1)
    negative_percent = round((negative_count / total_checkins) * 100, 1)
    
    most_common_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else "Unknown"
    
    # Format data for AI analysis
    history_text = "\n".join([f"{r[0]} {r[1]}: {r[2]} ({r[3]})" for r in rows])
    
    pattern_summary = f"""
Total Check-ins: {total_checkins}
Sentiment Distribution:
- Positive: {positive_percent}%
- Neutral: {neutral_percent}%
- Negative: {negative_percent}%
Most Common Emotion: {most_common_emotion}
"""

    try:
        # Generate concise insight
        insight_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": """You are an emotional wellness analyst. Provide a brief, clear summary of the user's emotional pattern. 
Use simple, everyday language that anyone can understand. Avoid complex or academic words.
Format: "Your emotions show [pattern]. [One simple observation]."
Max 2 sentences, 30 words total. Be warm, clear, and easy to understand."""
                },
                {
                    "role": "user", 
                    "content": f"Pattern: {most_common_emotion} is most common. Sentiment: {positive_percent}% positive, {neutral_percent}% neutral, {negative_percent}% negative."
                }
            ],
        )
        
        # Generate motivational quote
        motivation_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Generate an inspiring, uplifting quote relevant to the user's emotional state. 
Create an original motivational message - do NOT include any author attribution or quotation marks.
Keep it under 25 words. Be authentic and encouraging."""
                },
                {
                    "role": "user",
                    "content": f"User feels {most_common_emotion} most often. {positive_percent}% positive emotions overall."
                }
            ],
        )
        
        insight = insight_response.choices[0].message.content.strip().replace('"', '')
        motivation = motivation_response.choices[0].message.content.strip().replace('"', '')
        
        return jsonify({
            "insight": insight,
            "motivation": motivation,
            "patterns": {
                "total_checkins": total_checkins,
                "most_common_emotion": most_common_emotion,
                "sentiment_distribution": {
                    "positive": positive_percent,
                    "neutral": neutral_percent,
                    "negative": negative_percent
                },
                "emotion_breakdown": dict(emotion_counts.most_common(3))
            }
        })
        
    except Exception as e:
        print(f"Insight error: {e}")
        return jsonify({
            "insight": "Your emotions are valid. Keep tracking to understand yourself better.",
            "motivation": "Every step forward is progress. You're doing great!",
            "patterns": {
                "total_checkins": total_checkins,
                "most_common_emotion": most_common_emotion,
                "sentiment_distribution": {
                    "positive": positive_percent,
                    "neutral": neutral_percent,
                    "negative": negative_percent
                }
            }
        })


@app.route("/api/conversations", methods=["GET", "POST"])
def conversations():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        ensure_db_connection()
        cursor.execute("SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
        rows = cursor.fetchall()
        conversations_list = [{"id": r[0], "title": r[1], "created_at": str(r[2]), "updated_at": str(r[3])} for r in rows]
        return jsonify(conversations_list)

    elif request.method == "POST":
        data = request.json or {}
        title = data.get("title", "New Chat")

        ensure_db_connection()
        cursor.execute("INSERT INTO conversations (user_id, title) VALUES (%s, %s)", (user_id, title))
        conversation_id = cursor.lastrowid
        db.commit()

        return jsonify({"id": conversation_id, "title": title, "message": "Conversation created"}), 201


@app.route("/api/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ensure_db_connection()
    # First delete all chat logs for this conversation
    cursor.execute("DELETE FROM chat_logs WHERE conversation_id = %s AND user_id = %s", (conversation_id, user_id))
    # Then delete the conversation
    cursor.execute("DELETE FROM conversations WHERE id = %s AND user_id = %s", (conversation_id, user_id))
    db.commit()

    return jsonify({"message": "Conversation deleted"}), 200


@app.route("/api/conversations/<int:conversation_id>", methods=["PUT"])
def update_conversation(conversation_id):
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    new_title = data.get("title")

    if not new_title:
        return jsonify({"error": "Title is required"}), 400

    ensure_db_connection()
    # Check if conversation belongs to user
    cursor.execute("UPDATE conversations SET title = %s WHERE id = %s AND user_id = %s", (new_title, conversation_id, user_id))
    
    if cursor.rowcount == 0:
        return jsonify({"error": "Conversation not found or unauthorized"}), 404
        
    db.commit()

    return jsonify({"message": "Conversation updated", "title": new_title}), 200


@app.route("/api/profile", methods=["GET", "PUT", "DELETE"])
def profile():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        ensure_db_connection()
        cursor.execute("SELECT name, email, course, gender, date_of_birth, education_level, race FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "name": row[0],
            "email": row[1],
            "course": row[2],
            "gender": row[3],
            "date_of_birth": str(row[4]) if row[4] else None,
            "education_level": row[5],
            "race": row[6]
        })

    elif request.method == "PUT":
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        course = (data.get("course") or "").strip()
        gender = (data.get("gender") or "").strip()
        date_of_birth = data.get("date_of_birth")
        education_level = (data.get("education_level") or "").strip()
        race = (data.get("race") or "").strip()

        if not name or not email:
            return jsonify({"message": "Name and email required"}), 400

        # Check if email is taken by another user
        ensure_db_connection()
        cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (email, user_id))
        if cursor.fetchone():
            return jsonify({"message": "Email already in use"}), 400

        cursor.execute(
            "UPDATE users SET name = %s, email = %s, course = %s, gender = %s, date_of_birth = %s, education_level = %s, race = %s WHERE id = %s",
            (name, email, course, gender, date_of_birth, education_level, race, user_id)
        )
        db.commit()
        return jsonify({"message": "Profile updated"}), 200

    elif request.method == "DELETE":
        # Delete all associated data first (due to foreign key constraints)
        ensure_db_connection()
        try:
            # Delete chat logs
            cursor.execute("DELETE FROM chat_logs WHERE user_id = %s", (user_id,))
            # Delete checkins
            cursor.execute("DELETE FROM checkins WHERE user_id = %s", (user_id,))
            # Delete user account
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            db.commit()
            print(f"Account deleted successfully for user_id: {user_id}")
            return jsonify({"message": "Account deleted successfully"}), 200
        except mysql.connector.Error as db_error:
            db.rollback()
            print(f"Database error during account deletion: {db_error}")
            return jsonify({"message": "Database error occurred"}), 500
        except Exception as e:
            db.rollback()
            print(f"Unexpected error during account deletion: {e}")
            return jsonify({"message": "Failed to delete account"}), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not (email and password):
        return jsonify({"message": "Missing fields"}), 400

    ensure_db_connection()
    cursor.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    if not row:
        return jsonify({"message": "Invalid Email/Password"}), 401

    user_id, password_hash = row
    if not check_password_hash(password_hash, password):
        return jsonify({"message": "Invalid Email/Password"}), 401
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm='HS256')

    return jsonify({"message": "Login successful", "token": token, "user_id": user_id}), 200

if __name__ == "__main__":
    app.run(debug=True)
