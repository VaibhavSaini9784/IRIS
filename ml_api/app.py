from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

model = load_model("iris_model.h5")

class_labels = ['Shrey', 'Stuti_Agarwal', 'Sumit', 'Taruna', 'UmangJoshi', 'VC', 'Vaibhav_Chhipa', 'VS', 'Vansh']

@app.route("/labels", methods=["GET"])
def get_labels():
    return jsonify({"labels": class_labels})

IMG_SIZE = 128

eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def find_and_crop_eye(img_gray):
    # Standard Eye Detection
    eyes = eye_cascade.detectMultiScale(img_gray, scaleFactor=1.05, minNeighbors=7, minSize=(60, 60))
    if len(eyes) == 0:
        return None
    
    # Take the largest detected eye
    largest_eye = max(eyes, key=lambda rect: rect[2] * rect[3])
    ex, ey, ew, eh = largest_eye
    
    # Use 25% margin to match training data framing (Whole Eye region)
    margin = int(ew * 0.25)
    y1 = max(0, ey - margin)
    y2 = min(img_gray.shape[0], ey + eh + margin)
    x1 = max(0, ex - margin)
    x2 = min(img_gray.shape[1], ex + ew + margin)
    crop = img_gray[y1:y2, x1:x2]

    # Save debug crop for transparency
    try:
        cv2.imwrite("last_debug_scan.png", crop)
        print("✅ SUCCESS: Rectangular Eye Crop saved to 'last_debug_scan.png'")
    except:
        pass
        
    return crop

def preprocess_image(img):
    # Use CUBIC interpolation for sharper iris details
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_CUBIC)

    if len(img.shape) == 2:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        img = clahe.apply(img)
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    # Use 0 to 1 scaling (Standard Iris Normalization)
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

    cropped_eye = find_and_crop_eye(img)
    if cropped_eye is None:
        print("No eye detected")
    else:
        print("Eye detected and cropped")
        img = cropped_eye

    img = preprocess_image(img)
    img = np.expand_dims(img, axis=0)

    preds = model.predict(img)
    print(f"DEBUG: Raw Scores: {[f'{label}: {score:.4f}' for label, score in zip(class_labels, preds[0])]}")
    
    class_idx = np.argmax(preds[0])
    confidence = float(preds[0][class_idx])
    
    # SAFETY GUARD: If confidence is too low or it defaults to Shrey (Index 0) on a bad scan
    if confidence < 0.8:
        return jsonify({"person": "Unknown", "confidence": confidence})

    person = class_labels[class_idx]
    print("Returning:", person)
    return jsonify({
        "person": person,
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(port=5000)