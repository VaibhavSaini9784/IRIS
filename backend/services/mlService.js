const axios = require("axios");
const FormData = require("form-data");

// Accepts image Buffer object directly (from multer memoryStorage)
const predictIris = async (imageBuffer) => {
    try {
        const formData = new FormData();
        // Append the in-memory buffer as a file to send to Flask ML API
        formData.append("image", imageBuffer, {
            filename: "iris.png",
            contentType: "image/png"
        });

        const response = await axios.post(
            "http://127.0.0.1:5000/predict",
            formData,
            { headers: formData.getHeaders() }
        );

        return response.data;

    } catch (error) {
        if (error.response) {
            console.error("ML API Error Response:", error.response.data);
            throw new Error(error.response.data.error || "ML API rejected the image");
        } else {
            console.error("ML API Unreachable:", error.message);
            throw new Error("ML API is offline. Please start: python app.py in the ml_api folder.");
        }
    }
};

module.exports = { predictIris };