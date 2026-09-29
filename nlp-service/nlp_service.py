from flask import Flask, request, jsonify
from flask_cors import CORS

import nltk
import re

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Download required NLTK resources
nltk.download("punkt")
nltk.download("punkt_tab")
nltk.download("stopwords")
nltk.download("wordnet")
nltk.download("omw-1.4")


app = Flask(__name__)
CORS(app)


# NLP tools
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()


def preprocess_text(text):
    """
    NLP preprocessing pipeline:
    1. Lowercase
    2. Remove special characters
    3. Tokenization
    4. Stop-word removal
    5. Lemmatization
    """

    text = text.lower()

    text = re.sub(r"[^a-zA-Z\s]", "", text)

    tokens = word_tokenize(text)

    tokens = [
        word for word in tokens
        if word not in stop_words
    ]

    tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
    ]

    return tokens


# Example intents/questions
training_data = [
    "hello",
    "hi",
    "hey",
    "good morning",

    "what is your name",
    "who are you",

    "how are you",
    "how are you doing",

    "what can you do",
    "help me",

    "bye",
    "goodbye",
    "see you later",

    "thank you",
    "thanks"
]


intent_names = [
    "greeting",
    "greeting",
    "greeting",
    "greeting",

    "identity",
    "identity",

    "status",
    "status",

    "capabilities",
    "capabilities",

    "goodbye",
    "goodbye",
    "goodbye",

    "thanks",
    "thanks"
]


# Preprocess training data
processed_training_data = [
    " ".join(preprocess_text(text))
    for text in training_data
]


# TF-IDF vectorizer
vectorizer = TfidfVectorizer()

training_vectors = vectorizer.fit_transform(
    processed_training_data
)


def detect_intent(user_text):

    processed_text = " ".join(
        preprocess_text(user_text)
    )

    user_vector = vectorizer.transform(
        [processed_text]
    )

    similarities = cosine_similarity(
        user_vector,
        training_vectors
    )[0]

    best_match_index = similarities.argmax()

    confidence = float(
        similarities[best_match_index]
    )

    intent = intent_names[best_match_index]

    return intent, confidence


@app.route("/process", methods=["POST"])
def process_message():

    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({
            "error": "Message is required"
        }), 400

    message = data["message"]

    tokens = preprocess_text(message)

    intent, confidence = detect_intent(message)

    return jsonify({
        "original_text": message,
        "processed_tokens": tokens,
        "intent": intent,
        "confidence": round(confidence, 3)
    })


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "NLP service is running"
    })


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )