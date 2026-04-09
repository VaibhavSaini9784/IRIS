const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

// Initial data if file doesn't exist
const initialData = {
  teams: [
    {
      id: "6615567890abcdef12345678",
      name: "Engineering Team - Vision",
      location: "Main Lab",
      supervisor: "Admin Supervisor",
      workers: [
        { _id: "worker_1", name: "Shrey", aadhaarId: "0000-0000-0001", irisClassLabel: "Shrey" },
        { _id: "worker_2", name: "Stuti Agarwal", aadhaarId: "0000-0000-0002", irisClassLabel: "Stuti_Agarwal" },
        { _id: "worker_3", name: "Sumit", aadhaarId: "0000-0000-0003", irisClassLabel: "Sumit" },
        { _id: "worker_4", name: "Taruna", aadhaarId: "0000-0000-0004", irisClassLabel: "Taruna" },
        { _id: "worker_5", name: "Umang Joshi", aadhaarId: "0000-0000-0005", irisClassLabel: "UmangJoshi" },
        { _id: "worker_6", name: "Vaibhav Chhipa", aadhaarId: "0000-0000-0006", irisClassLabel: "Vaibhav_Chhipa" },
        { _id: "worker_7", name: "Vansh", aadhaarId: "0000-0000-0007", irisClassLabel: "Vansh" },
        { _id: "worker_8", name: "VC", aadhaarId: "0000-0000-0008", irisClassLabel: "VC" },
        { _id: "worker_9", name: "VS", aadhaarId: "0000-0000-0009", irisClassLabel: "VS" }
      ]
    }
  ],
  attendances: [],
  users: []
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

const getData = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveData = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

module.exports = { getData, saveData };
