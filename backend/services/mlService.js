const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const predictIris = async (imagePath) => {
    try {
        const formData = new FormData();
        formData.append("image", fs.createReadStream(imagePath));

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
             throw new Error("ML API is offline. Make sure `python app.py` is running.");
        }
    }
};

module.exports = { predictIris };