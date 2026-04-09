from flask import Flask, request, jsonify
import numpy as np
import cv2
from tensorflow.keras.models import load_model

app = Flask(__name__)

# Load model
model = load_model("iris_model.h5")

# Class labels (IMPORTANT: match your training order)
class_labels = ['Shrey', 'Stuti_Agarwal', 'Sumit', 'Taruna', 'UmangJoshi', 'VC', 'VS', 'Vaibhav_Chhipa', 'Vansh']

IMG_SIZE = 128

def preprocess_image(img):
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))

    if len(img.shape) == 2:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        img = clahe.apply(img)
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    img = img / 255.0
    return img

@app.route("/predict", methods=["POST"])
def predict():

    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']

    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return jsonify({"error": "Invalid image"}), 400

    img = preprocess_image(img)
    img = np.expand_dims(img, axis=0)

    preds = model.predict(img)

    class_idx = np.argmax(preds)
    confidence_raw = float(np.max(preds))
    confidence = round(confidence_raw, 3)

    person = class_labels[class_idx]

    print("🔍 DEBUG:")
    print("Predictions:", preds)
    print("Class:", person)
    print("Confidence:", confidence)

    if confidence < 0.9:
        print("👉 Returning UNKNOWN")
        return jsonify({
            "person": "Unknown",
            "confidence": confidence
        })

    print("👉 Returning:", person)
    return jsonify({
        "person": person,
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(port=5000)