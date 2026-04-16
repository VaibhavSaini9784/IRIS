import tensorflow as tf
import cv2
import numpy as np
import os

path = r'd:\IRIS_Project\IRIS\backend\uploads'
files = [f for f in os.listdir(path) if f.endswith('.jpg') or f.endswith('.png')]
model = tf.keras.models.load_model('iris_model.h5')

# We'll use 0-1 scaling as it's the most likely standard
print(f"--- SCANNING {len(files)} FILES FOR MAPPING ---")
for f in files:
    img_path = os.path.join(path, f)
    img = cv2.imread(img_path)
    if img is None: continue
    
    img = cv2.resize(img, (128, 128))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    inp = np.expand_dims(img / 255.0, axis=0)
    preds = model.predict(inp, verbose=0)[0]
    top_idx = np.argmax(preds)
    conf = preds[top_idx]
    
    print(f"File: {f} | Predicts INDEX: {top_idx} | Conf: {conf:.4f}")
