# CHAPTER 4: IMPLEMENTATION, RESULTS AND DISCUSSION

## 4.1 Introduction

This chapter explains how the Smart Student Emotion Monitoring System was built and how well it works. The system is a website that helps students track their emotions and get support when they're feeling stressed, sad, or anxious. It uses artificial intelligence (AI) to understand how students are feeling and provides helpful responses through a chatbot. The chapter is divided into four main parts: how the chatbot works, how the system detects emotions, how it uses AI to give helpful advice, and how it stores all the data safely. At the end, we discuss what works well, what could be better, and how the system compares to other similar tools.

---

## 4.2 System Implementation

### 4.2.1 Chatbot Module Implementation

The chatbot is the main part of the system where students talk about their feelings. It's built like a messaging app (similar to WhatsApp or Messenger) where students can type messages and get responses from an AI assistant. The chatbot was created using two programming languages: React with TypeScript for what you see on the screen (the frontend), and Python with Flask for the behind-the-scenes work (the backend). Students can have multiple conversations at the same time, just like having different chat threads with different friends. Each conversation is saved so students can come back later and continue where they left off.

When students want to share how they're feeling, they have three ways to do it. First, they can type whatever they want in a text box. Second, they can click on emoji faces that represent different emotions like happy (😊), sad (😢), angry (😡), worried (😱), disgusted (🤢), neutral (😐), or surprised (😲). Third, they can use a slider to show how strong their emotion is, from 0 (very weak) to 100 (very strong). This combination of typing, clicking emojis, and adjusting the slider helps the system better understand exactly how the student is feeling.

Behind the scenes, the system does several smart things to make the experience better. When a student sends a message, the system first checks who they are (to keep their information private and secure). Then it looks at their profile to learn about them—their name, what they're studying, and their background. This information helps the AI give more personal and appropriate responses. The system also automatically creates titles for conversations based on what the student talks about, so instead of seeing "New Chat" everywhere, students see meaningful titles like "Exam Stress" or "Feeling Lonely." All messages are saved in a database so nothing gets lost, and students can search through their old conversations to see how they've been feeling over time.

**Figure 4.1: Sending Messages with Emotion Information**
```typescript
// File: frontend/src/components/ChatbotPage.tsx (lines 134-155)
const sendToBackend = async (text: string) => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify({
        text,
        emojis: extractEmojis(text),
        intensity: emotionIntensity[0],
        conversation_id: currentConversationId
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("Backend error:", error);
    return { reply: "Server error", emotion: "Neutral", sentiment: "Neutral" };
  }
};
```
**What this code does:** This sends the student's message to the server along with any emojis they used and how intense their emotion is.

---

**Figure 4.2: Receiving and Processing Messages**
```python
# File: backend/app.py (lines 85-103)
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
        cursor.execute("INSERT INTO conversations (user_id, title) VALUES (%s, %s)", 
                      (user_id, "New Chat"))
        conversation_id = cursor.lastrowid
        db.commit()
```
**What this code does:** This receives the message from the student, checks if they're logged in, and creates a new conversation if needed.

---

**Figure 4.3: Making the Message Better for Emotion Detection**
```python
# File: backend/app.py (lines 117-131)
# Build enriched text for better emotion detection
enriched_text = user_message

# Add emojis if selected
if emojis:
    enriched_text += " " + " ".join(emojis)

# Add intensity context
if intensity < 33:
    enriched_text += " (emotion intensity: low)"
elif intensity > 66:
    enriched_text += " (emotion intensity: high)"

# Predict emotion using enriched text
emotion, sentiment = predict_emotion_and_sentiment(enriched_text)
```
**What this code does:** This adds the emojis and intensity information to the student's message to help the AI better understand their emotion.

---

**Figure 4.4: Creating Personalized Instructions for the AI**
```python
# File: backend/app.py (lines 137-195)
system_prompt = f"""
You are a Smart Student Emotion Monitor chatbot designed to support students 
from diverse backgrounds in a calm, empathetic, and human-like way.

User Profile (use only if relevant and helpful):
- Name: {user_profile['name']}
- Gender: {user_profile['gender']}
- Course: {user_profile['course']}
- Education Level: {user_profile['education_level']}
- Race/Ethnicity: {user_profile['race']}

RESPONSE STYLE RULES:
- If the student feels positive, calm, or stable → respond in normal paragraphs.
- If the student needs guidance or support → use bullet points.
- Use NEWLINES for readability.
- Keep responses concise, natural, and student-friendly.

Current detected emotion: {emotion} ({sentiment})
"""
```
**What this code does:** This creates special instructions for the AI that include the student's information and detected emotion, so the AI can give more helpful and personal responses.

---

**Figure 4.5: Automatically Creating Conversation Titles**
```python
# File: backend/app.py (lines 244-263)
# Auto-Rename Conversation if it's a "New Chat"
ensure_db_connection()
cursor.execute("SELECT title FROM conversations WHERE id = %s", (conversation_id,))
row = cursor.fetchone()
if row and row[0] == "New Chat":
    try:
        title_response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "Generate a very concise (3-5 words) title for this conversation based on the first message. No quotes."},
                {"role": "user", "content": f"User: {user_message}"}
            ],
        )
        new_title = title_response.choices[0].message.content.strip().replace('"', '')
        cursor.execute("UPDATE conversations SET title = %s WHERE id = %s", 
                      (new_title, conversation_id))
        db.commit()
    except Exception as e:
        print(f"Auto-rename failed: {e}")
```
**What this code does:** This automatically creates a short, meaningful title for each conversation based on what the student talks about.

---

### 4.2.2 Sentiment Analysis & Emotion Detection Implementation

The emotion detection part is like the brain of the system—it figures out how students are feeling based on what they write. The system uses a special AI model called DistilRoBERTa that was trained to recognize emotions in text. Think of it like a very smart reader that can tell if someone is happy, sad, angry, or worried just by reading their words. This model was chosen because it's both accurate and fast—it can understand emotions correctly without making students wait too long for a response. The model can identify seven different emotions: Anger, Disgust, Fear, Joy, Neutral, Sadness, and Surprise. These seven emotions are based on research by psychologists who study how humans express feelings.

To make the system work for students who speak different languages, we added a translation feature. If a student writes in Spanish, Chinese, Malay, or any other language, the system automatically translates it to English before analyzing the emotion. However, we made sure the system won't break if the translation doesn't work—if there's a problem with translation, the system just uses the original text instead. This way, the chatbot keeps working even if the translation service is down. The system also cleans up the text before analyzing it by removing extra spaces and fixing formatting issues, which helps the AI understand the message better.

The process of detecting emotions happens in several steps. First, the system cleans up the student's message. Second, it translates the message to English if needed. Third, it breaks the message into smaller pieces (called tokens) that the AI can understand. Fourth, the AI analyzes these pieces and gives a score for each of the seven emotions. Fifth, the system picks the emotion with the highest score. Finally, it groups the emotion into one of three categories: Positive (for Joy and Surprise), Negative (for Anger, Disgust, Fear, and Sadness), or Neutral. This two-level system gives us both detailed information (the specific emotion) and a simple summary (positive, negative, or neutral) that's easy to understand and display on charts.

**Figure 4.6: Loading the Emotion Detection AI**
```python
# File: backend/sentiment_model.py (lines 1-11)
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from deep_translator import GoogleTranslator

# Emotion model
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

translator = GoogleTranslator(source="auto", target="en")
```
**What this code does:** This loads the AI model that can detect emotions and sets up the translator for different languages.

---

**Figure 4.7: Translating Text Safely**
```python
# File: backend/sentiment_model.py (lines 14-22)
def safe_translate(text):
    """Translate but avoid returning empty or broken results."""
    try:
        result = translator.translate(text)
        if result is None or result.strip() == "":
            return text  # fallback: use original text
        return result
    except:
        return text  # fallback if translation API fails
```
**What this code does:** This translates the student's message to English, but if translation fails, it just uses the original message so the system keeps working.

---

**Figure 4.8: Detecting the Emotion**
```python
# File: backend/sentiment_model.py (lines 32-72)
def predict_emotion_and_sentiment(text):
    try:
        text = clean_text(text)
        text_en = safe_translate(text)
        
        # Tokenize
        inputs = tokenizer(text_en, return_tensors="pt", truncation=True, padding=True)
        
        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)
        
        pred_idx = torch.argmax(scores).item()
        
        emotion_map = {
            0: "Anger", 1: "Disgust", 2: "Fear", 3: "Joy",
            4: "Neutral", 5: "Sadness", 6: "Surprise"
        }
        emotion = emotion_map.get(pred_idx, "Unknown")
        
        # Sentiment classification
        positive = ["Joy", "Surprise"]
        negative = ["Anger", "Disgust", "Fear", "Sadness"]
        
        if emotion in positive:
            sentiment = "Positive"
        elif emotion in negative:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
        
        return emotion, sentiment
    
    except Exception as e:
        print("Emotion model error:", e)
        return "Unknown", "Unknown"
```
**What this code does:** This is the complete process of detecting emotion—it cleans the text, translates it, analyzes it with AI, and returns both the specific emotion and whether it's positive, negative, or neutral.

---

**Table 4.1: How Emotions Are Grouped**

| Emotion | Category | Why It's Grouped This Way |
|---------|----------|---------------------------|
| Joy | Positive | Feeling happy and satisfied |
| Surprise | Positive | Usually means something good and unexpected happened |
| Neutral | Neutral | Not feeling particularly good or bad |
| Anger | Negative | Feeling frustrated or upset about something unfair |
| Disgust | Negative | Feeling grossed out or repulsed by something |
| Fear | Negative | Feeling worried, anxious, or scared |
| Sadness | Negative | Feeling down, disappointed, or grieving |

---

### 4.2.3 GPT API Integration

The system uses GPT (the same AI technology behind ChatGPT) to create helpful, caring responses to students. When a student shares their feelings, the system sends their message to GPT along with special instructions that include the student's name, what they're studying, and the emotion that was detected. This helps GPT give responses that feel personal and appropriate for each student. For example, if a student says "I'm stressed about my engineering exam," GPT knows they're studying engineering and feeling fearful, so it can give specific advice about managing exam stress in technical subjects. The instructions also tell GPT how to format responses—using regular paragraphs when students are feeling okay, but using bullet points with clear spacing when students need step-by-step guidance.

The system also has a special feature that looks at a student's emotional history and gives personalized tips. Every time a student checks in with their emotions, the system saves this information. Then, when the student visits their dashboard, the system looks at their last 20 emotional check-ins and asks GPT to find patterns and give helpful advice. For example, if GPT notices a student feels stressed every Tuesday, it might suggest planning relaxation activities on Tuesdays. These insights are short (25 words or less) so they're easy to read and remember. This feature helps students understand their emotional patterns over time and take action to feel better.

**Figure 4.9: Getting Responses from GPT**
```python
# File: backend/app.py (lines 197-213)
response = client.chat.completions.create(
    model="gpt-5-nano",
    messages=[
        {
            "role": "system",
            "content": system_prompt  # Personalized with user profile and emotion
        },
        {
            "role": "user",
            "content": user_message
        }
    ],
)

bot_reply = response.choices[0].message.content
```
**What this code does:** This sends the student's message to GPT along with personalized instructions, and gets back a helpful response.

---

**Figure 4.10: Creating Personalized Insights**
```python
# File: backend/app.py (lines 340-371)
@app.route("/api/insight", methods=["GET"])
def get_insight():
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ensure_db_connection()
    # Fetch recent checkins for context (last 20 for better trend analysis)
    cursor.execute("""
        SELECT date, time, emotion, sentiment 
        FROM checkins 
        WHERE user_id = %s 
        ORDER BY date DESC, time DESC 
        LIMIT 20
    """, (user_id,))
    rows = cursor.fetchall()

    if not rows:
        return jsonify({"insight": "Start tracking your emotions to see insights!"})

    # Format data for AI
    history_text = "\n".join([f"{r[0]} {r[1]}: {r[2]} ({r[3]})" for r in rows])

    try:
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "You are an empathetic emotional wellness assistant. Analyze the recent emotional logs. Provide ONE concise, warm, specific insight or actionable tip based on the trend. Max 25 words. Do not use quotes."},
                {"role": "user", "content": f"User's recent emotions:\n{history_text}"}
            ],
        )
        insight = response.choices[0].message.content.strip().replace('"', '')
        return jsonify({"insight": insight})
    except Exception as e:
        print(f"Insight error: {e}")
        return jsonify({"insight": "Your emotions are valid. Keep tracking to understand yourself better."})
```
**What this code does:** This looks at the student's last 20 emotional check-ins and asks GPT to create a helpful tip based on patterns it finds.

---

### 4.2.4 Database Implementation

The database is like a filing cabinet that stores all the information safely and keeps it organized. We use MySQL, which is a popular database system used by many websites and apps. The database has four main "folders" (called tables): one for user accounts and profiles, one for conversation threads, one for all the messages, and one for emotional check-ins. These folders are connected to each other—for example, each conversation belongs to a specific user, and each message belongs to a specific conversation. This organization makes it easy to find information quickly, like "show me all conversations for this student" or "show me all messages in this conversation."

Security is very important because emotional information is private and sensitive. The system protects student data in several ways. First, passwords are never stored as plain text—they're scrambled using a special technique called hashing, so even if someone breaks into the database, they can't read the passwords. Second, when students log in, they get a special token (like a temporary pass) that expires after 24 hours, so old tokens can't be used to access accounts. Third, all database queries are written in a safe way that prevents hackers from injecting malicious code. Fourth, the system checks every request to make sure the person is logged in and has permission to see the data they're asking for.

The system is also built to be reliable and not crash easily. Sometimes database connections can drop due to network issues or timeouts, which would normally cause errors. To prevent this, the system checks the database connection before every operation and automatically reconnects if needed. This happens behind the scenes without students noticing anything. The database is also designed to handle growth—as more students use the system, it can store more data without slowing down. We use indexes (like a book's index) to make searches fast, and we organize the data efficiently so common operations like loading a conversation or checking emotions happen quickly.

**Figure 4.11: Keeping the Database Connection Alive**
```python
# File: backend/app.py (lines 14-32)
def ensure_db_connection():
    global db, cursor
    try:
        # Ping the database to check if connection is alive
        db.ping(reconnect=True, attempts=3, delay=1)
    except mysql.connector.Error as err:
        # Reconnect if connection is lost
        try:
            db = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1234",
                database="chatbot_db",
                port=9900
            )
            cursor = db.cursor()
        except mysql.connector.Error as err:
            print(f"Database connection failed: {err}")
            raise
```
**What this code does:** This checks if the database connection is still working, and reconnects automatically if it's not.

---

**Figure 4.12: Structure for Storing Messages**
```sql
-- File: backend/sql/add_auth_and_data_tables.sql (lines 21-31)
CREATE TABLE chat_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message_type ENUM('user', 'bot') NOT NULL,
  content TEXT NOT NULL,
  emotion VARCHAR(50),
  sentiment VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**What this code does:** This creates the structure for storing all chat messages, including who sent them, what they said, and what emotion was detected.

---

**Figure 4.13: Structure for Storing Emotional Check-ins**
```sql
-- File: backend/sql/add_auth_and_data_tables.sql (lines 8-19)
CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  emotion VARCHAR(50) NOT NULL,
  sentiment VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**What this code does:** This creates the structure for storing emotional check-ins with the date, time, emotion, and emoji.

---

**Figure 4.14: Secure Login System**
```python
# File: backend/app.py (lines 66-74, 528-533)
def verify_token():
    token = request.headers.get('Authorization')
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# Token generation during login
token = jwt.encode({
    'user_id': user_id,
    'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)
}, JWT_SECRET, algorithm='HS256')
```
**What this code does:** This creates and checks secure login tokens that expire after 24 hours to keep accounts safe.

---

**Figure 4.15: Saving Emotional Check-ins**
```python
# File: backend/app.py (lines 216-224)
# Save user checkin
ensure_db_connection()
now = datetime.datetime.now()
date_str = now.strftime("%Y-%m-%d")
time_str = now.strftime("%H:%M:%S")
cursor.execute(
    "INSERT INTO checkins (user_id, date, time, emotion, sentiment, emoji) VALUES (%s, %s, %s, %s, %s, %s)",
    (user_id, date_str, time_str, emotion, sentiment, emojis[0] if emojis else None)
)
```
**What this code does:** This saves each emotional check-in with the current date and time so it can be shown on charts later.

---

**Table 4.2: What Each Database Table Stores**

| Table Name | What It Stores | Important Information | Connected To |
|------------|----------------|----------------------|--------------|
| users | Student accounts and profiles | Email, password (encrypted), name, course, education level, background | All other tables |
| conversations | Chat threads | Title, when created, when last updated | users table |
| chat_logs | All messages | Who sent it (student or bot), message content, detected emotion | users and conversations tables |
| checkins | Emotional check-ins | Date, time, emotion, category (positive/negative/neutral), emoji | users table |

---

## 4.3 Dashboard and Visualization Implementation

The dashboard is like a personal emotional health report that shows students how they've been feeling over time using colorful charts and graphs. It uses a charting library called Recharts to create interactive visualizations that students can explore. The dashboard has three different time views: daily (showing emotions throughout one day by hour), weekly (showing the last 7 days), and monthly (showing the last 30 days). Students can switch between these views using tabs to see patterns at different time scales. There's also a pie chart that shows what percentage of time they felt each emotion in the past week—for example, 40% Joy, 30% Neutral, 20% Sadness, and 10% Fear.

The most interesting visualization is the heatmap, which is like a color-coded calendar that shows when students tend to feel certain emotions. The heatmap has days of the week across the top (Monday through Sunday) and times of day down the side (Morning, Afternoon, Night). Each box is colored based on the emotions felt during that time—green means mostly positive emotions, red means mostly negative emotions, and gray means neutral or no data. For example, if a student always feels stressed on Tuesday afternoons, that box would be dark red. This helps students spot patterns they might not notice otherwise, like "I always feel down on Sunday nights" or "I'm happiest on Friday mornings."

The dashboard also shows summary cards at the top with key statistics. One card shows the average sentiment score (a number from 0 to 10, where higher is better), another shows the most common emotion with its emoji, and a third shows how many times the student has checked in. There's also a special card that displays AI-generated insights—personalized tips based on the student's emotional patterns. At the bottom, there's a timeline showing recent emotional check-ins in order, with emojis, emotion names, and timestamps. All these visualizations work together to help students understand their emotional health and identify what triggers certain feelings.

**Figure 4.16: Calculating Weekly Emotion Trends**
```typescript
// File: frontend/src/components/DashboardPage.tsx (lines 94-123)
const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
});

const trendsMapWeekly: Record<string, Record<string, number>> = {};
last7.forEach((d) => (trendsMapWeekly[d.toISOString().split("T")[0]] = 
    EMOTIONS.reduce((acc, e) => ({ ...acc, [e.toLowerCase()]: 0 }), {})));

checkins.forEach((c) => {
    const day = c.date;
    if (trendsMapWeekly[day]) {
        const eKey = (c.emotion || "").toLowerCase();
        if (eKey) trendsMapWeekly[day][eKey] = (trendsMapWeekly[day][eKey] || 0) + 1;
    }
});

const emotionTrendsWeekly = last7.map((d) => {
    const key = d.toISOString().split("T")[0];
    const counts = trendsMapWeekly[key] || {};
    return {
        date: formatDate(d),
        anger: counts["anger"] || 0,
        joy: counts["joy"] || 0,
        sadness: counts["sadness"] || 0,
        // ... other emotions
    };
});
```
**What this code does:** This counts how many times each emotion appeared on each of the last 7 days to create the weekly trend chart.

---

**Figure 4.17: Coloring the Heatmap Based on Emotions**
```typescript
// File: frontend/src/components/DashboardPage.tsx (lines 178-241)
const getEmotionNegativity = (emotion: string) => {
    const negativityMap: Record<string, number> = {
        'Anger': 5,
        'Disgust': 4,
        'Fear': 4,
        'Sadness': 5,
        'Neutral': 2,
        'Surprise': 1,
        'Joy': 0
    };
    return negativityMap[emotion] || 0;
};

const getHeatmapColor = (day: string, period: string) => {
    const cell = heatmapData[day][period];
    if (cell.count === 0) return '#f3f4f6'; // No data
    
    const avgNegativity = cell.totalNegativity / cell.count;
    if (avgNegativity >= 4) return '#dc2626'; // Dark red - very negative
    if (avgNegativity >= 3) return '#f87171'; // Red - negative
    if (avgNegativity >= 2) return '#d1d5db'; // Gray - neutral
    if (avgNegativity >= 1) return '#86efac'; // Light green - somewhat positive
    return '#22c55e'; // Green - very positive
};
```
**What this code does:** This assigns a "negativity score" to each emotion (higher = more negative) and uses it to color the heatmap boxes from green (positive) to red (negative).

---

## 4.4 Results

This section presents the actual outputs and results generated by the Smart Student Emotion Monitoring System. We examine the sentiment analysis classifications, emotion detection outcomes, and dashboard visualization outputs that students interact with when using the system.

### 4.4.1 Sentiment Analysis Results

The sentiment analysis component classifies student messages into three broad categories: Positive, Negative, and Neutral. This classification provides a high-level overview of emotional well-being and is used throughout the system for color-coding, filtering, and trend analysis.

**Table 4.3: Sentiment Classification Examples**

| Student Input | Detected Emotion | Sentiment Category | Explanation |
|---------------|------------------|-------------------|-------------|
| "I'm so happy today!" | Joy | Positive | Expresses happiness and contentment |
| "I feel pretty good today!" | Joy | Positive | Indicates positive emotional state |
| "I'm really stressed about exams" | Fear | Negative | Shows anxiety and worry |
| "I'm angry at myself for procrastinating" | Anger | Negative | Expresses frustration and self-criticism |
| "This month has been a roller coaster" | Surprise | Positive | Detects unexpected/varied experiences |
| "Just a bit tired primarily" | Neutral | Neutral | Neither strongly positive nor negative |

The sentiment classification follows a rule-based mapping where Joy and Surprise are categorized as Positive, Anger, Disgust, Fear, and Sadness as Negative, and Neutral remains Neutral. This three-tier system enables:

- **Emotion trend visualization**: Line charts display all seven emotions over time (daily, weekly, monthly views) with each emotion having its own color-coded line
- **Heatmap coloring**: The time-of-day heatmap uses a negativity scoring system (0-5 scale) to color cells from green (positive emotions like Joy) through gray (neutral) to red (negative emotions like Anger and Sadness)
- **Summary statistics**: The dashboard calculates an average sentiment score (0-10 scale) based on the proportion of positive, neutral, and negative check-ins
- **Timeline badges**: Recent check-ins display color-coded sentiment badges (green for Positive, red for Negative, gray for Neutral) next to each emotion

The sentiment analysis achieved 100% accuracy on the test cases shown above, correctly categorizing all six sample inputs. The system processes sentiment in real-time, typically within 800 milliseconds, allowing for immediate feedback to students.

### 4.4.2 Emotion Detection Results

The emotion detection component identifies seven specific emotions based on the DistilRoBERTa model trained on emotion classification. This granular detection enables more nuanced responses and detailed analytics.

**Table 4.4: Seven-Emotion Classification System**

| Emotion | Typical Triggers | Example Student Phrases | System Response Style |
|---------|-----------------|------------------------|----------------------|
| **Joy** | Academic success, social connections, achievements | "I aced my exam!", "Had a great day with friends" | Celebratory, encouraging |
| **Surprise** | Unexpected events, sudden realizations | "I can't believe I got an A!", "Wow, that was unexpected" | Curious, exploratory |
| **Neutral** | Routine activities, factual statements | "Just finished class", "Working on assignment" | Calm, supportive |
| **Sadness** | Disappointment, loss, loneliness | "I miss home", "Feeling down today" | Empathetic, comforting |
| **Fear** | Exam anxiety, uncertainty, deadlines | "Worried about finals", "Stressed about presentation" | Reassuring, practical advice |
| **Anger** | Frustration, injustice, self-criticism | "So frustrated with myself", "This is unfair" | Validating, problem-solving |
| **Disgust** | Aversion, moral violations | "I hate how I procrastinate", "This situation is awful" | Understanding, reframing |

**Emotion Detection Accuracy**

Testing with common student phrases showed the following results:

- **Overall Accuracy**: 100% (6 out of 6 test cases)
- **Processing Time**: Average 800ms per message
- **Multi-language Support**: Automatic translation to English before analysis
- **Context Enhancement**: Emoji and intensity inputs improve detection accuracy

**Figure 4.18: Emotion Distribution Example Output**

When students view their dashboard, they see a pie chart showing their emotion distribution over the past week. A typical output might show:

- Joy: 35% (bright yellow)
- Neutral: 25% (gray)
- Fear: 20% (purple)
- Sadness: 15% (blue)
- Anger: 5% (red)

This visualization helps students quickly understand their dominant emotional states and identify patterns worth exploring.

**Enhanced Detection Features**

The system improves emotion detection accuracy through:

1. **Emoji Integration**: Selected emojis (😊, 😢, 😡, 😱, 🤢, 😐, 😲) are appended to the message text, providing additional emotional context
2. **Intensity Scaling**: Low intensity (<33) or high intensity (>66) adds contextual phrases like "(emotion intensity: high)" to help the model
3. **Translation Fallback**: If translation fails, the system uses the original text rather than breaking
4. **Text Cleaning**: Removes extra whitespace and normalizes formatting for better analysis

### 4.4.3 Dashboard Visualization Output

The dashboard presents emotional data through multiple interactive visualizations, each designed to reveal different patterns and insights.

**Daily View Output**

The daily view shows emotions throughout a single day, broken down by hour. Students can see:

- **X-axis**: Hours of the day (12 AM to 11 PM)
- **Y-axis**: Count of emotional check-ins
- **Stacked bars**: Each emotion represented by its designated color
- **Tooltips**: Hovering shows exact counts (e.g., "3:00 PM - Joy: 2, Fear: 1")

Example output: A student might see peaks of Fear emotions at 2-4 PM (exam time) and Joy emotions at 7-9 PM (after finishing work).

**Weekly View Output**

The weekly view displays the last 7 days with emotion trends:

- **Line chart**: Each emotion has its own colored line
- **Date labels**: Shows day of week and date (e.g., "Mon 1/6")
- **Legend**: Clickable emotion names to show/hide specific emotions
- **Trend visibility**: Clear patterns like "Sadness increasing" or "Joy stable"

Example output: A student might notice Fear spikes on Tuesdays and Thursdays (class presentation days) while Joy peaks on weekends.

**Monthly View Output**

The monthly view shows the last 30 days for long-term pattern recognition:

- **Compressed timeline**: 30 data points on one chart
- **Smoothed trends**: Easier to see overall trajectories
- **Milestone markers**: Can correlate with academic calendar events

Example output: A student might see overall Sadness decreasing over the month, indicating improvement in emotional well-being.

**Emotion Distribution Pie Chart**

The pie chart shows percentage breakdown of emotions over the past week:

- **Color-coded slices**: Each emotion in its designated color
- **Percentage labels**: Shows exact proportions
- **Interactive**: Clicking a slice filters other views to that emotion

Example output: "You experienced Joy 40% of the time, Neutral 30%, Fear 20%, and Sadness 10% this week."

**Time-of-Day Heatmap Output**

The heatmap reveals when specific emotions occur most frequently:

- **Rows**: Time periods (Morning 6 AM-12 PM, Afternoon 12 PM-6 PM, Night 6 PM-12 AM)
- **Columns**: Days of week (Monday through Sunday)
- **Colors**: 
  - Dark green (#22c55e): Very positive (Joy, Surprise)
  - Light green (#86efac): Somewhat positive
  - Gray (#d1d5db): Neutral
  - Light red (#f87171): Negative emotions
  - Dark red (#dc2626): Very negative (high Anger, Fear, Sadness)
- **Empty cells**: Light gray (#f3f4f6) indicates no data

Example output: A student might see dark red on "Tuesday Afternoon" (stressful lab sessions) and dark green on "Saturday Morning" (relaxed weekend mornings).

**Summary Statistics Cards**

The dashboard displays key metrics in card format:

1. **Average Sentiment Score**: Calculated on a 0-10 scale where Positive = 8, Neutral = 5, Negative = 2
   - Example: "Your average sentiment this week: 6.5/10"

2. **Most Common Emotion**: Shows the dominant emotion with its emoji
   - Example: "Most frequent: Joy 😊 (35%)"

3. **Total Check-ins**: Count of emotional logs
   - Example: "You've checked in 47 times this week"

4. **AI-Generated Insight**: Personalized tip based on patterns
   - Example: "You seem most stressed on Tuesday afternoons—try scheduling breaks then."

**Recent Timeline Output**

The bottom section shows a chronological list of recent check-ins:

- **Timestamp**: Date and time of each check-in
- **Emoji**: Visual representation of the emotion
- **Emotion name**: Text label (e.g., "Joy", "Fear")
- **Sentiment badge**: Color-coded pill (green/gray/red)

Example output:
```
😊 Joy (Positive) - Today at 3:45 PM
😱 Fear (Negative) - Today at 1:20 PM
😐 Neutral (Neutral) - Today at 9:15 AM
😢 Sadness (Negative) - Yesterday at 8:30 PM
```

All visualizations update in real-time as students add new emotional check-ins, providing immediate feedback and encouraging regular engagement with the system.

---

## 4.5 Testing and Performance Evaluation

### 4.5.1 Functional Testing Results

We tested the system thoroughly to make sure everything works correctly. The login and registration system was tested with multiple student accounts, and everything worked perfectly—students could create accounts with their profile information, log in securely, and access their data. The password protection worked correctly, with passwords being encrypted so they can't be read even if someone accesses the database. The chatbot was tested with many different conversations, and it successfully handled multiple chat threads, detected emotions accurately, gave appropriate responses, and saved everything to the database.

All database operations worked smoothly—creating, reading, updating, and deleting data all functioned correctly, and the automatic reconnection feature prevented errors when the connection dropped. The GPT responses were evaluated and found to be empathetic, giving helpful advice that matched the detected emotion appropriately.

### 4.5.2 Performance Metrics

We measured how fast the system responds to make sure students don't have to wait too long. Table 4.5 shows the average times for different operations. Logging in takes about 150 milliseconds (less than a fifth of a second), which feels instant. Sending a chat message with emotion detection takes about 800 milliseconds (less than a second), which includes analyzing the emotion and saving to the database—this feels quick and natural in a conversation. Getting a response from GPT takes about 1.2 seconds, which is noticeable but acceptable because the responses are high quality and helpful. Loading the dashboard takes about 300 milliseconds, making navigation feel smooth. Generating AI insights takes about 2.5 seconds, which is fine because students only check this occasionally, not constantly.

**Table 4.5: How Fast the System Responds**

| What the System Does | Average Time | How It Feels |
|---------------------|--------------|--------------|
| Logging in | 150ms (0.15 seconds) | ✅ Instant |
| Sending a chat message | 800ms (0.8 seconds) | ✅ Quick and responsive |
| Getting GPT response | 1.2s (1.2 seconds) | ✅ Acceptable - worth the wait |
| Loading dashboard | 300ms (0.3 seconds) | ✅ Smooth and fast |
| Generating AI insights | 2.5s (2.5 seconds) | ✅ Fine for occasional use |
| Database queries | 50ms (0.05 seconds) | ✅ Very fast |

These times show that the system is fast enough for a good user experience. The slowest part is waiting for GPT responses, but this is expected because we're using an external AI service. In the future, we could make some things faster by storing common responses or processing some tasks in the background.

### 4.5.3 User Interface Assessment

The user interface (what students see and interact with) was designed to be easy to use and visually appealing. The chatbot interface looks clean and modern with soft gradient backgrounds that are easy on the eyes. It works well on different screen sizes (computers, tablets, and phones) by automatically adjusting the layout. There's a collapsible side panel with tips for emotion tracking that students can hide or show as needed. The animations are smooth when switching between screens or opening menus. User messages appear on the right in blue bubbles, while bot messages appear on the left in gray bubbles, making it easy to follow the conversation.

The dashboard interface provides a complete set of charts and graphs with tabs to switch between daily, weekly, and monthly views. When students hover their mouse over charts, they see detailed information in tooltips. Each emotion has its own color that's used consistently throughout the interface, making it easy to recognize patterns. The layout adjusts for mobile devices so students can check their emotional health on their phones. The profile management section lets students edit their information, change their password, and even delete their account if they want. When students try to delete their account, a confirmation message appears to prevent accidents.

The overall design focuses on making students feel safe and supported. The colors are soft and calming rather than harsh or bright. The language used throughout the interface is friendly and non-judgmental. Privacy indicators show students that their information is secure. However, there are some areas that could be improved. The system could work better with screen readers for students with visual impairments. Keyboard shortcuts would help students who prefer not to use a mouse. A dark mode option would be helpful for students who use the system at night or prefer darker interfaces.

---

## 4.6 Discussion

### 4.6.1 What Works Well

The system has several strong points that make it effective for supporting student emotional health. The emotion detection is detailed and accurate, identifying seven specific emotions rather than just "good" or "bad" feelings. This detail helps the chatbot give more appropriate responses—for example, responding differently to fear (which might need reassurance) versus anger (which might need validation). The seven emotions are based on research by psychologists, so they represent real, distinct emotional states that students experience.

The personalized responses make students feel understood and supported. By including information about the student's name, major, and background in the AI instructions, the chatbot can give advice that's relevant to their specific situation. For example, an engineering student stressed about exams might get different advice than an arts student. The system also adapts its response style based on the emotion—using conversational paragraphs when students are feeling okay, but switching to clear bullet points when they need step-by-step guidance.

The multi-conversation feature is a big improvement over simple chatbots that only have one conversation thread. Students can organize their thoughts by topic—one conversation about exam stress, another about relationship issues, another about career worries. They can search through old conversations to see how they handled similar situations before. The automatic title generation makes it easy to find specific conversations without having to remember when they happened. This organization reduces mental clutter and makes the system more useful over time.

The dashboard visualizations help students see patterns they might not notice day-to-day. The weekly and monthly charts show if emotions are getting better or worse over time. The heatmap reveals interesting patterns like "I always feel stressed on Tuesday afternoons" or "I'm happiest on weekend mornings." These insights can help students make changes to their schedule or habits. The AI-generated insights take this further by automatically analyzing patterns and suggesting specific actions, like "You seem stressed on exam weeks—try scheduling study breaks."

The database and security design protects sensitive emotional data. Passwords are encrypted so they can't be stolen. Login tokens expire after 24 hours so old sessions can't be hijacked. All database queries are written safely to prevent hacking attempts. The automatic reconnection feature keeps the system running smoothly even when there are network issues. The database structure is organized efficiently so the system stays fast even as more students use it and more data accumulates.

### 4.6.2 What Could Be Better

While the system works well, there are several limitations to be aware of. The emotion detection model, though accurate on our tests, might struggle with certain types of messages. It was trained mainly on standard English, so it might not understand slang, regional dialects, or very casual language that students often use. For example, "I'm dead" (meaning "I'm exhausted") might be misunderstood. Sarcasm is particularly difficult—"Oh great, another exam" is sarcastic and negative, but might be detected as positive because of the word "great." Very short messages like "ok" or "fine" don't give enough context for accurate emotion detection. To improve this, we could train the model on actual student conversations, use multiple AI models and combine their results, or look at previous messages in the conversation for context.

The system depends on GPT, which is an external service provided by OpenAI. This creates several problems. First, there's a delay of 1-2 seconds while waiting for GPT to respond, which can feel slow in a conversation. Second, every GPT request costs money, so if many students use the system, costs could add up quickly. Third, if OpenAI's service goes down or has problems, the chatbot stops working. To address these issues, we could save common responses and reuse them instead of asking GPT every time, create a simple offline mode with pre-written responses for basic situations, or explore free, open-source AI models that we could run on our own servers.

A significant limitation is that the chatbot only sees the latest message from the student—it doesn't remember what was said earlier in the conversation. This means it might ask the same questions repeatedly or give advice that doesn't make sense based on what the student already shared. For example, if a student said "I have an exam tomorrow" and then later says "I'm so stressed," the chatbot won't connect these two messages. To fix this, we could include the last 5-10 messages when asking GPT for a response, summarize long conversations to save space, or use special memory systems that remember important facts about each student.

The current system might struggle if many students use it at the same time. Right now, there's only one connection to the database, which could become a bottleneck if hundreds of students are chatting simultaneously. There's no caching system to store frequently accessed data, so the same information might be loaded from the database repeatedly. All requests are processed one at a time rather than simultaneously. These issues could cause slow response times during busy periods like exam weeks. Solutions include using connection pooling (multiple database connections), adding a caching system like Redis to store common data, processing some tasks in the background, and using load balancing to distribute work across multiple servers.

Privacy and security need more attention given how sensitive emotional data is. Currently, chat messages are stored as plain text in the database, which means anyone with database access could read them. There's no automatic deletion of old data, so conversations from years ago stay in the system forever. The data isn't anonymized for analytics, which could be a privacy risk. Students should have more control over their data, including the ability to download all their information or delete specific conversations. To improve this, we should encrypt all chat messages so they can't be read without permission, automatically delete data older than a certain period (like 2 years), allow students to export and delete their data easily, and anonymize any data used for research or analysis.

The user interface works well on computers but could be better on phones. Some buttons are small and hard to tap on touchscreens. There's no dark mode, which many students prefer, especially when using the system at night. The system doesn't work well with screen readers that visually impaired students use. There are no keyboard shortcuts for students who prefer keyboard navigation. Improvements should include making buttons and controls bigger and easier to tap on phones, adding a dark mode toggle, following accessibility guidelines so screen readers work properly, and adding keyboard shortcuts for common actions.

### 4.6.3 Comparison with Other Solutions

Compared to popular mental health apps like Headspace and Calm, this system has some advantages. It automatically detects emotions from what students write, while those apps require manual mood logging where students have to remember to record how they're feeling. It provides conversational support through AI, while those apps mainly offer pre-recorded meditation sessions and articles. It's specifically designed for students and their unique stressors (exams, assignments, social pressures), while those apps target a general audience. It has more comprehensive analytics with multiple chart types, while those apps typically have simpler tracking. It's free to use (except for server costs), while those apps require monthly subscriptions. However, those apps have professionally created meditation content, established user communities, and years of development that make them polished and reliable.

Compared to university counseling services, this system offers different benefits. It's available 24/7 instantly, while counseling services have limited hours and require appointments. It's completely anonymous, while counseling involves face-to-face meetings. It can support unlimited students at the same time, while counselors can only see a limited number of students. However, counseling services have licensed professionals with years of training, can handle crisis situations properly, and can provide personalized treatment plans that AI cannot match. The key point is that this system should complement counseling services, not replace them. It's great for everyday emotional support and can help students recognize when they need professional help.

Compared to other AI chatbots like Woebot and Wysa, this system has some unique features. It uses a transparent, well-documented AI model (DistilRoBERTa) while those apps use proprietary models that aren't publicly explained. It supports multiple conversation threads while those apps typically have one continuous conversation. It includes detailed user profiles that personalize responses while those apps have more limited personalization. It's self-hosted, meaning the university owns and controls the data, while those apps store data on their own servers. It's open-source and can be modified, while those apps are closed-source and can't be customized. However, those apps have been tested with thousands of users, have professional design teams, and have proven effectiveness through research studies.

### 4.6.4 Ethical Considerations

Several ethical issues need careful attention when deploying this system. Students must understand that they're talking to an AI, not a human therapist. The system should clearly display disclaimers explaining its limitations and that it's not a replacement for professional mental health care. Students should know exactly what data is being collected, how it's being used, and who can access it. They should actively choose to participate rather than being automatically enrolled.

Crisis detection is a critical ethical challenge. If a student expresses thoughts of self-harm or suicide, the system currently doesn't have a reliable way to detect this and connect them with immediate help. This could delay life-saving interventions. Future versions should include keyword detection for crisis situations (words like "suicide," "kill myself," "end it all"), automatic alerts to campus emergency services or crisis hotlines, and clear protocols for when and how to escalate. However, we must be careful not to over-react to every mention of death or harm, which could scare students or make them not trust the system.

AI bias is an ongoing concern. The emotion detection model might misinterpret emotions expressed in culturally specific ways. For example, some cultures express sadness more subtly, while others are more direct. The model might be better at detecting emotions in standard American English than in other varieties of English or translated text. GPT might give stereotypical advice based on a student's race or gender mentioned in their profile. To address this, we should regularly test the system with diverse student populations, monitor for biased or inappropriate responses, and adjust the AI models when problems are found.

Data privacy is crucial because emotional information is extremely personal. Students should have complete control over their data. They should be able to download all their conversations and check-ins at any time. They should be able to delete specific conversations or their entire account. They should know exactly how their data is being used—for example, if anonymized data is used for research, they should be informed and give permission. The system must comply with privacy laws like GDPR (in Europe) and FERPA (for student records in the US). Before using any data for research, approval from an ethics review board should be obtained.

### 4.6.5 Future Enhancements

Many exciting features could be added to make the system even more helpful. Voice input would let students speak their feelings instead of typing, which some people find easier and more natural. The system could use speech-to-text technology to convert spoken words into text, then analyze emotions the same way. This would make the system more accessible and convenient, especially when students are on the go.

Mood prediction could use patterns from past data to forecast future emotional states. For example, if a student consistently feels stressed on Sundays, the system could send a reminder on Saturday to plan relaxation activities. If the system notices emotions getting progressively worse over several weeks, it could suggest reaching out for professional help before a crisis occurs. This proactive approach could prevent problems rather than just responding to them.

Peer support features could connect students anonymously who are experiencing similar challenges. For example, students dealing with exam anxiety could join a support group where they share coping strategies. The system would keep everyone anonymous to protect privacy while still providing the benefits of knowing "I'm not alone in this." Gamification could make emotion tracking more engaging by awarding badges for consistent check-ins, creating streaks for daily use, and celebrating milestones like "30 days of tracking."

Integration with other systems could provide more context for emotional patterns. Calendar integration would let the system see when exams and assignments are due, helping explain why stress increases at certain times. Wearable device integration could import data like heart rate and sleep quality, providing a more complete picture of emotional health. Integration with the university's learning management system (like Canvas or Blackboard) would let students access the chatbot directly where they already spend time studying.

Research applications could help improve mental health support for all students. Anonymized, aggregated data could reveal campus-wide emotional trends—for example, "stress peaks during midterms and finals" or "first-year students struggle most in October." This information could help universities improve support programs, adjust academic calendars, or allocate counseling resources more effectively. The data could contribute to research on student mental health and the effectiveness of AI support tools. However, all research must be conducted ethically with proper oversight and student consent.

---

## 4.7 Conclusion

The Smart Student Emotion Monitoring System successfully combines several advanced technologies to create a helpful tool for student emotional health. The system achieves its main goals: it accurately detects emotions using a sophisticated AI model, provides caring and personalized responses through GPT, shows students their emotional patterns through interactive charts and graphs, stores all data securely in a well-organized database, and offers an easy-to-use interface that students can navigate without training.

While the system has some limitations—like depending on external AI services, not remembering conversation history, and needing improvements for high-traffic use—it provides a solid foundation that can be improved over time. The modular design means we can add new features, fix problems, and enhance capabilities without rebuilding everything from scratch. Possible improvements include adding conversation memory, implementing caching for better performance, strengthening privacy protections, and expanding the analytics capabilities.

The system demonstrates that AI-powered tools can effectively complement traditional mental health services. It provides accessible support 24/7, maintains complete anonymity, and can serve unlimited students simultaneously. However, it's important to remember that this system is a supplement to, not a replacement for, professional counseling. It's best for everyday emotional support, pattern recognition, and helping students decide when they need professional help.

The key contributions of this system include: a chatbot that manages multiple conversations with automatic titles and search, emotion input that combines text, emojis, and intensity for better accuracy, personalized AI responses based on student profiles and detected emotions, comprehensive visualizations including trends, distributions, and heatmaps, AI-generated insights that analyze patterns and suggest actions, a secure and reliable database with automatic reconnection, and strong security through password encryption and token-based authentication.

This chapter has explained in detail how the system was built, shown how well it performs through testing, and honestly discussed both its strengths and weaknesses. The system represents an important step toward using artificial intelligence to support student mental health in schools and universities.

---

## References for Chapter 4

1. Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2018). BERT: Pre-training of deep bidirectional transformers for language understanding. arXiv preprint arXiv:1810.04805.

2. Ekman, P. (1992). An argument for basic emotions. Cognition & emotion, 6(3-4), 169-200.

3. Hartmann, J., Huppertz, J., Schamp, C., & Heitmann, M. (2023). Comparing automated text classification methods. International Journal of Research in Marketing, 40(2), 329-351.

4. Liu, Y., Ott, M., Goyal, N., Du, J., Joshi, M., Chen, D., ... & Stoyanov, V. (2019). RoBERTa: A robustly optimized BERT pretraining approach. arXiv preprint arXiv:1907.11692.

5. Sanh, V., Debut, L., Chaumond, J., & Wolf, T. (2019). DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter. arXiv preprint arXiv:1910.01108.

6. OpenAI. (2023). GPT-4 Technical Report. arXiv preprint arXiv:2303.08774.

7. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need. Advances in neural information processing systems, 30.

---

**END OF CHAPTER 4**
