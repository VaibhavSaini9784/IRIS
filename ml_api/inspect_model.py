import tensorflow as tf
import numpy as np

try:
    model = tf.keras.models.load_model('iris_model.h5')
    print("Model loaded successfully.")
    print("\nInput shape:", model.input_shape)
    print("Output shape:", model.output_shape)
    
    # Try to find labels if they are embedded (unlikely in h5, but worth a check)
    if hasattr(model, 'class_names'):
        print("Embedded labels:", model.class_names)
        
except Exception as e:
    print("Error:", str(e))
