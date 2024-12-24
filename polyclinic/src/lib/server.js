// Importing express using ES Module syntax
import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import pkg from "mongodb";
const { ObjectId } = pkg;
import { promises as fs } from "fs"; // Use `fs.promises` for asynchronous file operations
import { performance } from "perf_hooks";
const app = express();
const PORT = process.env.PORT || 5001;
const uri =
  "mongodb+srv://jagateesvaran:6Y4K3wSWbFKBdjwR@cluster0.s78gw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createIndexes() {
  const collection = client.db("polyclinic").collection("user");
  const result = await collection.createIndex({ email: 1 }, { unique: true });
  const role_id = await collection.createIndex({ role_id_fk : 1 });

  console.log(`Index created: ${result}`);
  console.log(`Role id created: ${role_id}`);

  // Example to create indexes on patient_id and doctor_id
  const appointmentsCollection = client.db("polyclinic").collection("appointments");
  await appointmentsCollection.createIndex({ patient_id: 1 });  // Index for patient_id
  await appointmentsCollection.createIndex({ doctor_id: 1 });   // Index for doctor_id
  console.log(`Index created: ${appointmentsCollection}`);

   // Example to create indexes on patient_id and doctor_id
   const medicalConditionsCollection = client.db("polyclinic").collection("medical_condition");
   await medicalConditionsCollection.createIndex({ name: 1 });  // Index for patient_id
   console.log(`Index created: ${medicalConditionsCollection}`);

    // Example to create indexes on patient_id and doctor_id
    const medication = client.db("polyclinic").collection("medication");
    await medication.createIndex({ name: 1 });  // Index for patient_id
    console.log(`Index created: ${medication}`);
}


async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    // await createIndexes();  // Ensure indexes are created once connected
  } catch (e) {
    console.error("Could not connect to MongoDB:", e);
    process.exit(1);  // Exit process if cannot connect
  }
}

connect().catch(console.error);


/* 
===============================================================
                 Login & Registration Endpoints
===============================================================

Endpoints:
1. /login
2. /register
===============================================================
*/

app.get("/login", async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ message: "Email parameter is required." });
  }

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  try {
    const collection = client.db("polyclinic").collection("user");
    
    // Get the explain results for the query
    const explainResults = await collection.find({ email: userEmail })
                                           .limit(1)
                                           .explain("executionStats");

    // Fetch the user data
    const user = await collection.findOne({ email: userEmail });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Login by Email
      Email: ${userEmail}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
      Execution Stats: ${JSON.stringify(explainResults.executionStats)}
    `;
    console.log(logData);

    if (user) {
      const { _id, user_id, role_id_fk, username } = user;
      res.json({
        exists: true,
        userData: {
          _id,
          user_id,
          role_id_fk,
          username,
          email: userEmail,
        },
      });
    } else {
      res.json({ exists: false });
    }
  } catch (e) {
    console.error("Error checking user:", e);
    res.status(500).json({ message: "Error accessing the database." });
  }
});

app.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    username,
    password,
    role_id,
    age,
    gender,
    phoneNumber,
    address,
  } = req.body;

  if (!firstName || !lastName || !email || !username || !password || !role_id || !age || !gender || !phoneNumber || !address) {
    return res.status(201).json({ message: "All fields are required." });
  }

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  try {
    const collection = client.db("polyclinic").collection("user");

    // Check if the user already exists by email
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      const isPasswordMatch = await bcrypt.compare(password, existingUser.password);
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      const logData = `
        Query: Register - Check Existing User
        Email: ${email}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Date: ${new Date().toISOString()}
      `;
      console.log(logData);

      if (isPasswordMatch) {
        return res.status(201).json({ message: "User already registered with this email and password." });
      } else {
        return res.status(201).json({ message: "Email already in use with a different password." });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role_id,
      age,
      gender,
      phoneNumber,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newUser);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Register - Insert New User
      Email: ${email}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    if (result.acknowledged) {
      res.status(201).json({
        message: "success",
        userData: {
          _id: result.insertedId,
          firstName,
          lastName,
          email,
          username,
          role_id,
          age,
          gender,
          phoneNumber,
          address,
        },
      });
    } else {
      res.status(201).json({ message: "Registration failed." });
    }
  } catch (e) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Register - Error
      Email: ${email}
      Error: ${e.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.error(logData);
    await fs.appendFileSync("query_logs.txt", logData); // Use async logging

    res.status(201).json({ message: "Error accessing the database." });
  }
});

/* 
===============================================================
                 Admin Dashboard Endpoints
===============================================================

Endpoints:
1. /medical_condition
2. /add_medical_condition:
3. /delete_medical_condition
4. /add_doctor
5. /get_user

===============================================================
*/

app.get("/medical_condition", async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  try {
    const collection = client.db("polyclinic").collection("medical_condition");
    const medicalConditions = await collection.find().toArray();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Medical Conditions
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({ message: medicalConditions });
  } catch (error) {
    console.error("Error in /medical_condition GET:", error);
    res.status(500).json({ error: "An error occurred while fetching medical conditions." });
  }
});

app.post("/add_medical_condition", async (req, res) => {
  const { name, description } = req.body;

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required." });
  }

  try {
    const collection = client.db("polyclinic").collection("medical_condition");
    const result = await collection.insertOne({ name, description });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Add Medical Condition
      Name: ${name}
      Description: ${description}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(201).json({
      message: "Medical condition added successfully.",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error in /add_medical_condition POST:", error);
    res.status(500).json({ error: "An error occurred while adding the medical condition." });
  }
});

app.delete("/delete_medical_condition", async (req, res) => {
  const { _id } = req.body;

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  if (!_id) {
    return res.status(400).json({ error: "Medical condition ObjectId is required." });
  }

  try {
    const collection = client.db("polyclinic").collection("medical_condition");
    const result = await collection.deleteOne({ _id: new ObjectId(_id) });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Delete Medical Condition
      ID: ${_id}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
     // await fs.appendFileSync("query_logs.txt", logData);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Medical condition not found." });
    }

    res.status(200).json({ message: "Medical condition deleted successfully.", id: _id });
  } catch (error) {
    console.error("Error in delete_medical_condition DELETE:", error);
    res.status(500).json({ error: "An error occurred while deleting the medical condition." });
  }
});

app.post("/add_doctor", async (req, res) => {
  const { user_info, role_info } = req.body;

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  if (!user_info || !role_info) {
    return res.status(400).json({ error: "Both user_info and role_info are required." });
  }

  try {
    const doctorData = {
      ...user_info,
      ...role_info,
      role_id_fk: 2,
      create_at: new Date().toISOString(),
    };

    const collection = client.db("polyclinic").collection("user");
    const result = await collection.insertOne(doctorData);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Add Doctor
      User Info: ${JSON.stringify(user_info)}
      Role Info: ${JSON.stringify(role_info)}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(201).json({
      message: "Doctor added successfully.",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error in /add_doctor POST:", error);
    res.status(500).json({ error: "An error occurred while adding the doctor." });
  }
});

app.get("/user", async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({ error: "Page and limit must be positive integers." });
    }

    const skip = (page - 1) * limit;
    const collection = client.db("polyclinic").collection("user");
    const users = await collection.find().skip(skip).limit(limit).toArray();
    const totalUsers = await collection.countDocuments();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Users
      Page: ${page}, Limit: ${limit}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: users,
      totalCount: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


/* 
===============================================================
                 User Dashboard Endpoints
===============================================================

Endpoints:
1. /get_profile
2. /update_profile
3. /add_appointment
4. /get_appointments_by_patient
5. /update_appointment
6. /delete_appointment
7. payment
8. /get_full_appointment

===============================================================
*/

app.get('/get_profile', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert memory usage to MB

  try {
    // Extract id from query parameters
    const { id } = req.query;

    // Validate id
    if (!id) {
      const logData = `
        Query: Get Profile
        Status: Failed
        Reason: User ID is required
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
       //  // fs.appendFileSync("query_logs.txt", logData);
      return res.status(400).json({ error: "User ID is required." });
    }

    if (!ObjectId.isValid(id)) {
      const logData = `
        Query: Get Profile
        Status: Failed
        Reason: Invalid User ID format: ${id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid User ID format." });
    }

    const collection = client.db("polyclinic").collection("user");

    // Find the user by _id
    const user = await collection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      const logData = `
        Query: Get Profile
        Status: Failed
        Reason: User not found
        User ID: ${id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "User not found." });
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Profile
      Status: Success
      User ID: ${id}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    // Respond with the user profile
    res.status(200).json({
      message: "User profile fetched successfully.",
      profile: user,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Profile
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while fetching the profile." });
  }
});


app.put('/update_profile', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert memory usage to MB

  try {
    const { id, updates } = req.body;

    // Validate required fields
    if (!id) {
      const logData = `
        Query: Update Profile
        Status: Failed
        Reason: User ID is required
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "User ID is required." });
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      const logData = `
        Query: Update Profile
        Status: Failed
        Reason: Updates must be a non-empty object
        User ID: ${id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Updates must be a non-empty object." });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      const logData = `
        Query: Update Profile
        Status: Failed
        Reason: Invalid User ID format
        User ID: ${id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid User ID format." });
    }

    const collection = client.db("polyclinic").collection("user");

    // Flatten updates if it contains a nested "user_info" object
    const flattenedUpdates = updates.user_info
      ? { ...updates.user_info }
      : updates;

    // Perform the update operation
    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // Match user by _id
      { $set: flattenedUpdates } // Apply the updates directly to the top-level fields
    );

    // Check if the user was found and updated
    if (result.matchedCount === 0) {
      const logData = `
        Query: Update Profile
        Status: Failed
        Reason: User not found
        User ID: ${id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "User not found." });
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Update Profile
      Status: Success
      User ID: ${id}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Profile updated successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Update Profile
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Date: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while updating the profile." });
  }
});


app.post('/add_appointment', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert memory usage to MB

  try {
    const { appointment_info } = req.body;

    console.log("Appointment Info Received:", appointment_info);

    // Validate required fields in appointment_info
    if (!appointment_info || !appointment_info.date || !appointment_info.time || !appointment_info.type || !appointment_info.user_id) {
      const logData = `
        Query: Add Appointment
        Status: Failed
        Reason: Missing required fields in appointment_info
        Data: ${JSON.stringify(appointment_info)}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({
        error: "All fields (date, time, type, and user_id) in appointment_info are required.",
      });
    }

    const { date, time, type, user_id } = appointment_info;

    // Ensure `user_id` is a valid ObjectId
    if (!ObjectId.isValid(user_id)) {
      const logData = `
        Query: Add Appointment
        Status: Failed
        Reason: Invalid user_id format
        user_id: ${user_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid user_id format." });
    }

    const userCollection = client.db("polyclinic").collection("user");
    const appointmentCollection = client.db("polyclinic").collection("appointments");

    // Find all doctors with role_id_fk === 1
    const doctors = await userCollection.find({ role_id_fk: 1 }).toArray();

    if (doctors.length === 0) {
      const logData = `
        Query: Add Appointment
        Status: Failed
        Reason: No doctors available
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No doctors available." });
    }

    // Pick a random doctor
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    const doctor_id = randomDoctor._id;

    // Create the appointment object
    const appointment = {
      date,
      time,
      type,
      doctor_id,
      patient_id: new ObjectId(user_id), // Convert `user_id` to ObjectId
      status: "pending", // Default status
      created_at: new Date(),
    };

    // Insert the appointment into the database
    const result = await appointmentCollection.insertOne(appointment);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Add Appointment
      Status: Success
      Appointment ID: ${result.insertedId}
      Doctor Assigned: ${JSON.stringify(randomDoctor)}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(201).json({
      message: "Appointment added successfully.",
      appointmentId: result.insertedId,
      doctor: randomDoctor, // Return doctor details for confirmation
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Add Appointment
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while adding the appointment." });
  }
});


app.post('/get_appointments_by_patient', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert memory usage to MB

  try {
    const { patient_id } = req.body;

    // Validate the provided patient_id
    if (!patient_id || !ObjectId.isValid(patient_id)) {
      const logData = `
        Query: Get Appointments by Patient
        Status: Failed
        Reason: Invalid or missing patient ID
        Patient ID: ${patient_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing patient ID." });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");

    console.log(`Searching for appointments with patient_id: ${patient_id}`);

    // Find all appointments for the given patient_id
    const appointments = await appointmentCollection.find({ patient_id: new ObjectId(patient_id) }).toArray();

    if (appointments.length === 0) {
      const logData = `
        Query: Get Appointments by Patient
        Status: Failed
        Reason: No appointments found
        Patient ID: ${patient_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No appointments found for this patient." });
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Appointments by Patient
      Status: Success
      Patient ID: ${patient_id}
      Number of Appointments: ${appointments.length}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    // Respond with the appointments
    res.status(200).json({
      message: "Appointments fetched successfully.",
      appointments,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Appointments by Patient
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while fetching appointments." });
  }
});

app.put('/update_appointment', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { appointment_info } = req.body;
    // Validate required fields in appointment_info
    if (!appointment_info || !appointment_info.appointment_id) {
      const logData = `
        Query: Update Appointment
        Status: Failed
        Reason: Appointment ID (appointment_id) is missing
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({
        error: "Appointment ID (appointment_id) is required in appointment_info.",
      });
    }

    const { appointment_id, ...updates } = appointment_info;

    // Validate `appointment_id` format
    if (!ObjectId.isValid(appointment_id)) {
      const logData = `
        Query: Update Appointment
        Status: Failed
        Reason: Invalid appointment_id format
        Appointment ID: ${appointment_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid appointment_id format." });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");

    console.log(`Updating appointment with ID: ${appointment_id}`);
    
    // Find the appointment and update its details
    const result = await appointmentCollection.updateOne(
      { _id: new ObjectId(appointment_id) }, // Match by appointment_id
      { $set: updates } // Update other fields
    );

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    if (result.matchedCount === 0) {
      const logData = `
        Query: Update Appointment
        Status: Failed
        Reason: Appointment not found
        Appointment ID: ${appointment_id}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "Appointment not found." });
    }

    const logData = `
      Query: Update Appointment
      Status: Success
      Appointment ID: ${appointment_id}
      Updated Fields: ${JSON.stringify(updates)}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Appointment updated successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Update Appointment
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while updating the appointment." });
  }
});


app.delete('/delete_appointment', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { appointment_id } = req.body;

    // Validate the provided appointment_id
    if (!appointment_id || !ObjectId.isValid(appointment_id)) {
      const logData = `
        Query: Delete Appointment
        Status: Failed
        Reason: Invalid or missing appointment ID
        Appointment ID: ${appointment_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing appointment ID." });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");

    console.log(`Attempting to delete appointment with ID: ${appointment_id}`);

    // Delete the appointment by its ID
    const result = await appointmentCollection.deleteOne({ _id: new ObjectId(appointment_id) });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    if (result.deletedCount === 0) {
      const logData = `
        Query: Delete Appointment
        Status: Failed
        Reason: Appointment not found
        Appointment ID: ${appointment_id}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "Appointment not found." });
    }

    const logData = `
      Query: Delete Appointment
      Status: Success
      Appointment ID: ${appointment_id}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
     // fs.appendFileSync("query_logs.txt", logData);

    res.status(200).json({
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Delete Appointment
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while deleting the appointment." });
  }
});

app.post('/get_full_appointment', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { appointment_id } = req.body;

    // Validate the provided ObjectId
    if (!appointment_id || !ObjectId.isValid(appointment_id)) {
      const logData = `
        Query: Get Full Appointment
        Status: Failed
        Reason: Invalid or missing appointment ID
        Appointment ID: ${appointment_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing appointment ID." });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");

    console.log(`Searching for appointment with _id: ${appointment_id}`);
    // Find the appointment by _id
    const appointment = await appointmentCollection.findOne({ _id: new ObjectId(appointment_id) });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

    if (!appointment) {
      const logData = `
        Query: Get Full Appointment
        Status: Failed
        Reason: Appointment not found
        Appointment ID: ${appointment_id}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "Appointment not found for the given ID." });
    }

    const logData = `
      Query: Get Full Appointment
      Status: Success
      Appointment ID: ${appointment_id}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    // Return the full appointment details
    res.status(200).json({
      message: "Appointment fetched successfully.",
      appointment,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

    const logData = `
      Query: Get Full Appointment
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while fetching the appointment." });
  }
});


app.get('/get_payments_by_user', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    // Extract the user_id from the query parameters
    const { user_id } = req.query;

    // Validate the `user_id`
    if (!user_id || !ObjectId.isValid(user_id)) {
      const logData = `
        Query: Get Payments By User
        Status: Failed
        Reason: Invalid or missing user_id
        User ID: ${user_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing user_id." });
    }

    const db = client.db("polyclinic");
    const paymentCollection = db.collection("payment");

    console.log(`Searching for payments with user_id: ${user_id}`);

    // Find all payments where `user_id` matches
    const payments = await paymentCollection
      .find({ user_id: new ObjectId(user_id) })
      .toArray();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

    if (!payments || payments.length === 0) {
      const logData = `
        Query: Get Payments By User
        Status: Failed
        Reason: No payments found
        User ID: ${user_id}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No payments found for the given user_id." });
    }

    const logData = `
      Query: Get Payments By User
      Status: Success
      User ID: ${user_id}
      Payments Count: ${payments.length}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Payments retrieved successfully.",
      payments,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

    const logData = `
      Query: Get Payments By User
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while retrieving payments." });
  }
});


app.put('/update_payment_status', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { user_id } = req.body;

    // Validate the `user_id`
    if (!user_id || !ObjectId.isValid(user_id)) {
      const logData = `
        Query: Update Payment Status
        Status: Failed
        Reason: Invalid or missing user_id
        User ID: ${user_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing user_id." });
    }

    const db = client.db("polyclinic");
    const paymentCollection = db.collection("payment");

    console.log(`Searching for payments with user_id: ${user_id}`);

    // Find payments for the user
    const payments = await paymentCollection
      .find({ user_id: new ObjectId(user_id), payment_status: { $ne: "confirmed" } })
      .toArray();

    const endTimeForSearch = performance.now();
    const endMemoryForSearch = process.memoryUsage().heapUsed / 1024 / 1024;

    if (!payments || payments.length === 0) {
      const logData = `
        Query: Update Payment Status
        Status: Failed
        Reason: No pending payments found
        User ID: ${user_id}
        Time Taken (Search): ${(endTimeForSearch - startTime).toFixed(2)} ms
        Memory Used (Search): ${(endMemoryForSearch - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No pending payments found for the given user_id." });
    }

    console.log(`Found ${payments.length} pending payments for user_id: ${user_id}`);

    // Update all payments' statuses to "confirmed"
    const result = await paymentCollection.updateMany(
      { user_id: new ObjectId(user_id), payment_status: { $ne: "confirmed" } },
      { $set: { payment_status: "confirmed" } }
    );

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Update Payment Status
      Status: Success
      User ID: ${user_id}
      Pending Payments Found: ${payments.length}
      Updated Payments: ${result.modifiedCount}
      Time Taken (Total): ${(endTime - startTime).toFixed(2)} ms
      Memory Used (Total): ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Payment statuses updated to confirmed successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Update Payment Status
      Status: Error
      Error: ${error.message}
      Time Taken (Total): ${(endTime - startTime).toFixed(2)} ms
      Memory Used (Total): ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while updating the payment status." });
  }
});

/* 
===============================================================
                 Doctor Dashboard Endpoints
===============================================================

Endpoints:
1. /get_profile -> use the same end point in user dashboard
2. /update_profile - > use the same end point in user dashboard
3. /get_appointments_by_doctor
4. /get_all_medications
5. /medical_condition -> use the same end point from admin dashboard
6. /find_and_update_appointment 
7. /reassign_doctor 
===============================================================
*/

app.post('/get_appointments_by_doctor', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { doctor_id } = req.body;

    // Validate the provided doctor_id
    if (!doctor_id || !ObjectId.isValid(doctor_id)) {
      const logData = `
        Query: Get Appointments by Doctor
        Status: Failed
        Reason: Invalid or missing doctor ID
        Doctor ID: ${doctor_id}
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(400).json({ error: "Invalid or missing doctor ID." });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");

    console.log(`Fetching appointments for doctor_id: ${doctor_id}`);

    // Get the explain results for the query
    const explainResults = await appointmentCollection.find({ doctor_id: new ObjectId(doctor_id) })
      .explain("executionStats");

    // Fetch all appointments for the given doctor_id
    const appointments = await appointmentCollection
      .find({ doctor_id: new ObjectId(doctor_id) })
      .toArray();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    if (appointments.length === 0) {
      const logData = `
        Query: Get Appointments by Doctor
        Status: Failed
        Reason: No appointments found
        Doctor ID: ${doctor_id}
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
        Execution Stats: ${JSON.stringify(explainResults.executionStats)}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No appointments found for this doctor." });
    }

    const logData = `
      Query: Get Appointments by Doctor
      Status: Success
      Doctor ID: ${doctor_id}
      Appointments Found: ${appointments.length}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
      Execution Stats: ${JSON.stringify(explainResults.executionStats)}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Appointments fetched successfully.",
      appointments,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get Appointments by Doctor
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while fetching appointments." });
  }
});



app.get('/get_all_medications', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const medicationCollection = client.db("polyclinic").collection("medication");

    console.log("Fetching all medications...");

    // Fetch all medications
    const medications = await medicationCollection.find().toArray();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    if (medications.length === 0) {
      const logData = `
        Query: Get All Medications
        Status: Failed
        Reason: No medications found
        Time Taken: ${(endTime - startTime).toFixed(2)} ms
        Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
        Time: ${new Date().toISOString()}
      `;
      console.error(logData);
      return res.status(404).json({ error: "No medications found." });
    }

    const logData = `
      Query: Get All Medications
      Status: Success
      Medications Found: ${medications.length}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Medications fetched successfully.",
      medications,
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Get All Medications
      Status: Error
      Error: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Time: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while fetching medications." });
  }
});


app.put('/find_and_update_appointment', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { diagnosis_info, medication_info } = req.body;

    console.log("Received request with the following data:");
    console.log("Diagnosis Info:", diagnosis_info);
    console.log("Medication Info:", medication_info);

    // Validate `diagnosis_info`
    if (!diagnosis_info || !diagnosis_info.patient_id) {
      console.error("Validation Error: Missing patient_id in diagnosis_info.");
      return res.status(400).json({ error: "Missing patient_id in diagnosis_info." });
    }

    const { patient_id, diagnosis_description, severity } = diagnosis_info;

    // Validate `patient_id` (acting as `_id`)
    if (!ObjectId.isValid(patient_id)) {
      console.error(`Validation Error: Invalid patient_id format: ${patient_id}`);
      return res.status(400).json({ error: "Invalid patient_id format." });
    }

    const db = client.db("polyclinic");
    const appointmentCollection = db.collection("appointments");
    const paymentCollection = db.collection("payment");

    console.log(`Searching for an appointment with _id: ${patient_id}`);
    // Find the appointment using `_id` (passed as `patient_id`)
    const appointment = await appointmentCollection.findOne({ _id: new ObjectId(patient_id) });

    if (!appointment) {
      console.error(`Appointment not found for _id: ${patient_id}`);
      return res.status(404).json({ error: "Appointment not found for the given _id." });
    }

    console.log("Found Appointment:", appointment);

    // Prepare updates
    const updates = {};
    if (diagnosis_description) {
      updates.diagnosis_info = { diagnosis_description, severity };
      console.log("Updating Diagnosis Info:", updates.diagnosis_info);
    }
    if (medication_info) {
      updates.medication_info = medication_info;
      console.log("Updating Medication Info:", updates.medication_info);
    }

    // Update status if it's currently "pending"
    let isConfirmed = false;
    if (appointment.status === "pending") {
      updates.status = "confirmed";
      isConfirmed = true;
      console.log("Updating Status to Confirmed.");
    }

    console.log("Prepared Updates:", updates);

    // Update the appointment
    const result = await appointmentCollection.updateOne(
      { _id: new ObjectId(patient_id) }, // Match by _id
      { $set: updates } // Update diagnosis_info, medication_info, and status
    );

    if (result.modifiedCount === 0) {
      console.error(`Failed to update the appointment with _id: ${patient_id}`);
      return res.status(400).json({ error: "Failed to update the appointment." });
    }

    console.log(`Appointment with _id: ${patient_id} updated successfully.`);

    // If the appointment was confirmed, calculate total price and add a payment record
    if (isConfirmed) {
      let totalAmount = 0;

      // Calculate total amount from `medication_info`
      if (Array.isArray(medication_info)) {
        totalAmount = medication_info.reduce((sum, med) => {
          const price = parseFloat(med.price) || 0; // Default to 0 if price is missing or invalid
          return sum + price;
        }, 0);
      }

      console.log(`Calculated Total Amount: $${totalAmount.toFixed(2)}`);

      const paymentDoc = {
        appointment_id: new ObjectId(patient_id), // Link to the appointment
        user_id: appointment.patient_id, // Add user_id from the appointment
        doctor_id: appointment.doctor_id, // Add doctor_id from the appointment
        amount_due: totalAmount, // Calculated total amount
        payment_status: "pending", // Default payment status
        created_at: new Date(),
      };

      const paymentResult = await paymentCollection.insertOne(paymentDoc);

      if (!paymentResult.acknowledged) {
        console.error("Failed to create a payment record.");
        return res.status(500).json({ error: "Failed to create a payment record after confirming the appointment." });
      }

      console.log("Payment record created successfully:", paymentResult.insertedId);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Find and Update Appointment
      Appointment ID: ${patient_id}
      Status: Success
      Updates Applied: ${JSON.stringify(updates)}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Timestamp: ${new Date().toISOString()}
    `;
    console.log(logData);
    res.status(200).json({
      message: "Appointment updated successfully and payment record created (if confirmed).",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Find and Update Appointment
      Status: Error
      Error Message: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Timestamp: ${new Date().toISOString()}
    `;
    console.error(logData);
    res.status(500).json({ error: "An error occurred while updating the appointment." });
  }
});


app.put('/reassign_doctor', async (req, res) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  try {
    const { appointment_id } = req.body;

    // Validate `appointment_id`
    if (!appointment_id || !ObjectId.isValid(appointment_id)) {
      const errorLog = `Validation Error: Invalid or missing appointment_id: ${appointment_id}`;
      console.error(errorLog);
      return res.status(400).json({ error: errorLog });
    }

    const appointmentCollection = client.db("polyclinic").collection("appointments");
    const userCollection = client.db("polyclinic").collection("user");

    console.log(`Searching for appointment with _id: ${appointment_id}`);
    // Find the appointment by `appointment_id`
    const appointment = await appointmentCollection.findOne({ _id: new ObjectId(appointment_id) });

    if (!appointment) {
      const errorLog = `Appointment not found for _id: ${appointment_id}`;
      console.error(errorLog);
      return res.status(404).json({ error: errorLog });
    }

    console.log("Found Appointment:", appointment);

    console.log("Searching for a new doctor...");
    // Find all doctors with `role_id_fk === 1`
    const doctors = await userCollection.find({ role_id_fk: 1 }).toArray();

    if (doctors.length === 0) {
      const errorLog = "No doctors available for reassignment.";
      console.error(errorLog);
      return res.status(404).json({ error: errorLog });
    }

    // Pick a random doctor (ensure it's different from the current one)
    let newDoctor;
    do {
      newDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    } while (newDoctor._id.toString() === appointment.doctor_id?.toString());

    console.log(`Reassigning to Doctor ID: ${newDoctor._id}`);

    // Update the appointment with the new doctor ID
    const result = await appointmentCollection.updateOne(
      { _id: new ObjectId(appointment_id) }, // Match by appointment ID
      { $set: { doctor_id: newDoctor._id } } // Reassign doctor_id
    );

    if (result.modifiedCount === 0) {
      const errorLog = `Failed to reassign doctor for appointment with _id: ${appointment_id}`;
      console.error(errorLog);
      return res.status(400).json({ error: errorLog });
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const logData = `
      Query: Reassign Doctor
      Appointment ID: ${appointment_id}
      New Doctor ID: ${newDoctor._id}
      New Doctor Name: ${newDoctor.first_name} ${newDoctor.last_name}
      Status: Success
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Timestamp: ${new Date().toISOString()}
    `;
    console.log(logData);
     // fs.appendFileSync("query_logs.txt", logData);

    res.status(200).json({
      message: "Doctor reassigned successfully.",
      newDoctor: {
        doctor_id: newDoctor._id,
        name: `${newDoctor.first_name} ${newDoctor.last_name}`,
      },
    });
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const errorLog = `
      Query: Reassign Doctor
      Status: Error
      Error Message: ${error.message}
      Time Taken: ${(endTime - startTime).toFixed(2)} ms
      Memory Used: ${(endMemory - startMemory).toFixed(2)} MB
      Timestamp: ${new Date().toISOString()}
    `;
    console.error(errorLog);
     // fs.appendFileSync("query_logs.txt", errorLog);

    res.status(500).json({ error: "An error occurred while reassigning the doctor." });
  }
});

connect().catch(console.error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
