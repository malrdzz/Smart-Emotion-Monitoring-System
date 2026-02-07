import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from deep_translator import GoogleTranslator
import re

# Emotion model
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

translator = GoogleTranslator(source="auto", target="en")

# Emoji to emotion mapping
EMOJI_TO_EMOTION = {
    # Anger
    '😡': 'Anger', '😠': 'Anger', '🤬': 'Anger', '💢': 'Anger',
    # Disgust
    '🤢': 'Disgust', '🤮': 'Disgust', '🤧': 'Disgust',
    # Fear
    '😱': 'Fear', '😨': 'Fear', '😰': 'Fear', '😧': 'Fear',
    # Joy
    '😊': 'Joy', '😃': 'Joy', '😄': 'Joy', '😁': 'Joy', '😀': 'Joy', 
    '🙂': 'Joy', '😌': 'Joy', '😍': 'Joy', '🥰': 'Joy', '😘': 'Joy',
    '🤗': 'Joy', '🥳': 'Joy', '🎉': 'Joy', '✨': 'Joy',
    # Neutral
    '😐': 'Neutral', '😑': 'Neutral', '😶': 'Neutral',
    # Sadness
    '😢': 'Sadness', '😭': 'Sadness', '😞': 'Sadness', '😔': 'Sadness',
    '😟': 'Sadness', '🙁': 'Sadness', '☹️': 'Sadness', '😣': 'Sadness',
    '😖': 'Sadness', '😫': 'Sadness', '😩': 'Sadness', '🥺': 'Sadness',
    # Surprise
    '😲': 'Surprise', '😮': 'Surprise', '😯': 'Surprise', '😳': 'Surprise',
    '🤯': 'Surprise', '😦': 'Surprise',
}


def extract_emojis(text):
    """Extract all emojis from text."""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002600-\U000027BF"  # misc symbols
        "\U0001F900-\U0001F9FF"  # supplemental symbols (includes 🤢)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+", 
        flags=re.UNICODE
    )
    emojis = emoji_pattern.findall(text)
    print(f"DEBUG: Extracted emojis from '{text}': {emojis}")  # Debug logging
    return emojis


def detect_emotion_from_emojis(text):
    """Detect emotion based on emojis in the text."""
    emojis = extract_emojis(text)
    
    if not emojis:
        print("DEBUG: No emojis found in text")
        return None, None
    
    # Count emotions from emojis
    emotion_counts = {}
    for emoji in emojis:
        emotion = EMOJI_TO_EMOTION.get(emoji)
        print(f"DEBUG: Emoji '{emoji}' mapped to emotion '{emotion}'")
        if emotion:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    if not emotion_counts:
        print("DEBUG: No emotions mapped from emojis")
        return None, None
    
    # Get most common emotion
    dominant_emotion = max(emotion_counts, key=emotion_counts.get)
    print(f"DEBUG: Dominant emotion from emojis: {dominant_emotion}")
    
    # Map to sentiment
    positive = ["Joy", "Surprise"]
    negative = ["Anger", "Disgust", "Fear", "Sadness"]
    
    if dominant_emotion in positive:
        sentiment = "Positive"
    elif dominant_emotion in negative:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"
    
    print(f"DEBUG: Final emotion={dominant_emotion}, sentiment={sentiment}")
    return dominant_emotion, sentiment


def safe_translate(text):
    """Translate but avoid returning empty or broken results."""
    try:
        result = translator.translate(text)
        if result is None or result.strip() == "":
            return text  # fallback: use original text
        return result
    except:
        return text     # fallback if translation API fails


def clean_text(text):
    """Basic cleaning to improve model accuracy."""
    text = text.strip()
    text = text.replace("\n", " ")
    return text


def predict_emotion_and_sentiment(text):
    try:
        text = clean_text(text)
        
        # First, try to detect emotion from emojis
        emoji_emotion, emoji_sentiment = detect_emotion_from_emojis(text)
        
        # If emojis provide clear emotion, use that
        if emoji_emotion and emoji_sentiment:
            return emoji_emotion, emoji_sentiment

        # Otherwise, use text-based detection
        # Translate safely
        text_en = safe_translate(text)

        # Tokenize
        inputs = tokenizer(text_en, return_tensors="pt", truncation=True, padding=True)

        with torch.no_grad():
            outputs = model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)

        pred_idx = torch.argmax(scores).item()

        emotion_map = {
            0: "Anger",
            1: "Disgust",
            2: "Fear",
            3: "Joy",
            4: "Neutral",
            5: "Sadness",
            6: "Surprise"
        }

        emotion = emotion_map.get(pred_idx, "Unknown")

        # Better sentiment rules
        positive = ["Joy", "Surprise"]
        negative = ["Anger", "Disgust", "Fear", "Sadness"]
        neutral = ["Neutral"]

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
