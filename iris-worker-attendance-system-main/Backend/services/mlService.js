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
        console.error("ML API Error:", error.message);
        throw error;
    }
};

module.exports = { predictIris };