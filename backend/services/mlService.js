const axios = require("axios");
const FormData = require("form-data");

const predictIris = async (imageBuffer) => {
    try {
        const formData = new FormData();
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

const getTrainedLabels = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:5000/labels");
        return response.data.labels;
    } catch (error) {
        console.error("Failed to fetch ML labels:", error.message);
        return ['Shrey', 'Stuti_Agarwal', 'Sumit', 'Taruna', 'UmangJoshi', 'VC', 'Vaibhav_Chhipa', 'VS', 'Vansh'];
    }
};

module.exports = { predictIris, getTrainedLabels };