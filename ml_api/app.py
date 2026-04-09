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

# Load OpenCV's pre-trained Haar Cascade for eye detection
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def find_and_crop_eye(img_gray):
    # Detect eyes
    eyes = eye_cascade.detectMultiScale(img_gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(eyes) == 0:
        return None
    
    # Get the largest eye to avoid small background false positives
    largest_eye = max(eyes, key=lambda rect: rect[2] * rect[3])
    x, y, w, h = largest_eye
    
    # Add a small breathing margin around the eye for the crop
    margin = int(w * 0.1)
    y1 = max(0, y - margin)
    y2 = min(img_gray.shape[0], y + h + margin)
    x1 = max(0, x - margin)
    x2 = min(img_gray.shape[1], x + w + margin)
    
    return img_gray[y1:y2, x1:x2]

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
        return jsonify({"error": "Invalid image format"}), 400

    # Auto-crop the eye if it's a wide webcam shot
    cropped_eye = find_and_crop_eye(img)
    if cropped_eye is None:
        print("⚠️ No eye detected in image (assuming already cropped upload)")
    else:
        print("✅ Eye detected and cropped successfully")
        img = cropped_eye

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