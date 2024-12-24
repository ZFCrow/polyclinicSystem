import React, { useState, useEffect } from "react";
import { MultiSelect } from "react-multi-select-component";
import { useNavigate } from "react-router-dom";
import { isUserLoggedIn } from '../lib/utils'; // Adjust the path based on your structure

const DoctorDashboard = () => {
  const [activePage, setActivePage] = useState("get_appointment");
  const [medications, setMedications] = useState([]);
  const [getMedicalCondition, setMedicalCondition] = useState([]);
  const [medicationDosages, setMedicationDosages] = useState({});
  const [loading, setLoading] = useState(false); // Add loading state for logout
  const [userUUID, setUserUUID] = useState(null);

  // Update your initial state for profileData
  const [profileData, setProfileData] = useState({
    username: "",
    password_hash: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    specialty: "",
  });

  const medicationOptions = medications.map((med) => ({
    label: `${med.name} - ${med.description} - $${med.price}`,
    value: med.medication_id, // Use medication_id as the unique value
  }));

  const medicationConditionOptions = getMedicalCondition.map((med) => ({
    label: `${med.name} - ${med.description} `,
    value: med.condition_id, // Use medication_id as the unique value
  }));

  const [appointments, setAppointments] = useState([]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [formData, setFormData] = useState({
    remark: "",
    severity: "",
    condition: "",
    medication: "",
    price: 20,
  });


  // State for the editable fields in the appointment form
  const [editFormData, setEditFormData] = useState({
    severity: "",
    medication: [], // For multiple medications
    medicalCondition: [], // For multiple conditions
  });

  const [doctor_id_ID, setdoctor_id] = useState(null);
  const [user_id, setuser_id] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const doctor_id = localStorage.getItem("doctor_id");
    const user_id = localStorage.getItem("user_id");
    const user_uuid = localStorage.getItem("user_uuid");

    setuser_id(user_id);
    setdoctor_id(doctor_id);
    setUserUUID(user_uuid);

  }, []);

  const handleLogout = () => {
    setLoading(true); // Start loading spinner

    // Simulate a delay (e.g., API call)
    setTimeout(() => {
      localStorage.clear(); // Clear user data from local storage
      setLoading(false); // Stop loading spinner
      navigate("/login"); // Redirect to the login page
    }, 2000); // Simulate a 2-second delay for demonstration purposes
  };

  
  useEffect(() => {
    if (!isUserLoggedIn()) {
      alert('Please log in first');
      navigate('/login'); // Redirect to login page
    }
  }, []);

  // Add this function inside your component
  const handleGetProfile = () => {
    const apiUrl = `/api/user/${user_id}`;
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Fetching profile failed");
        }
        return response.json();
      })
      .then((data) => {
        const userData = data.message.data;

        // Flatten the data structure
        setProfileData({
          username: userData.username || "",
          password_hash: userData.password_hash || "",
          email: userData.email || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone_number: userData.role.phone_number || "",
          specialty: userData.role.specialty || "",
        });
      })
      .catch((error) => {
        console.error("Fetching profile failed:", error);
      });
  };

  // Add this function inside your component
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdateProfile = () => {
    // Validate phone number (must be exactly 8 digits)
    const phoneRegex = /^[0-9]{8}$/;
    if (!phoneRegex.test(profileData.phone_number)) {
      alert("Phone number must be exactly 8 digits.");
      return;
    }

    // Validate email (must contain @)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const apiUrl = `/api/user/${user_id}`;
    const updatedProfile = {
      user_info: {
        username: profileData.username,
        password_hash: profileData.password_hash,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        specialty: profileData.specialty,
      },
    };


    fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedProfile),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Updating profile failed");
        }
        return response.json();
      })
      .then((data) => {
        alert("Profile updated successfully!");
      })
      .catch((error) => {
        console.error("Updating profile failed:", error);
        alert("Failed to update profile.");
      });
  };

  const handleReassignAppointment = (appointment) => {
    const apiUrl = `/api/appointment/${appointment.appointment_id}/${doctor_id_ID}`;
    fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Fetching appointments failed");
        }
        return response.json();
      })
      .then((data) => {

        if (data.message.status === "error") {
          alert("Unable to Reasign. Please contact admin")
        } else if (data.message.status === "success") {
          alert("Has been reassign")
          window.location.reload();
        }
        // Update appointments state with fetched data
        // setAppointments(data.message.appointments);
      })
      .catch((error) => {
        console.error("Fetching ReassignAppointment failed:", error);
      });
  };

  const formatTime = (timeString) => {
    let [hours, minutes] = timeString.split(":"); // Split time into hours and minutes
    let period = "AM";

    hours = parseInt(hours, 10);

    // Convert 24-hour time to 12-hour format
    if (hours >= 12) {
      period = "PM";
      if (hours > 12) hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${minutes} ${period}`;
  };

  const handleGetAppointments = () => {
    if (import.meta.env.VITE_APP_USE_SQL === "TRUE") {
      const apiUrl = `/api/appointment/${doctor_id_ID}/`;
      fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Fetching appointments failed");
          }
          return response.json();
        })
        .then((data) => {
          // Update appointments state with fetched data
          setAppointments(data.message.appointments);
        })
        .catch((error) => {
          console.error("Fetching appointments failed:", error);
        });
    } else {
      
      const url = "http://localhost:5001/get_appointments_by_doctor";

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ doctor_id: userUUID }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch appointments");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Appointments for Doctor:", data.appointments);
          setAppointments(data.appointments);
        })
        .catch((error) => {
          console.error("Error fetching appointments:", error);
        });
    }
  };


  const handleGetMedication = () => {
    const apiUrl = `/api/medication`;
  
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Fetching medication failed");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched medication data:", data);
        if (Array.isArray(data.message)) {
          const formattedMedications = data.message.map((med) => ({
            medication_id: med.medication_id,
            name: med.name,
            description: med.description,
            price: parseFloat(med.price).toFixed(2),
          }));
          setMedications(formattedMedications);
        } else {
          console.error("Unexpected data format:", data.message);
        }
      })
      .catch((error) => {
        console.error("Fetching medication failed:", error);
      });
  };



  const handleGetMedicationCondition = () => {
    const apiUrl = `/api/medical_condition/${3}`;
  
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch medical conditions.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.message)) {
          const formattedMedications = data.message.map((med) => ({
            condition_id: med.condition_id,
            name: med.name,
            description: med.description,
          }));
          setMedicalCondition(formattedMedications);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching medical conditions:", error);
      });
  };
  

  useEffect(() => {
    if (doctor_id_ID) {
      handleGetAppointments();
      handleGetMedication();
      handleGetMedicationCondition();
      handleGetProfile(); // Add this line to fetch profile data
    }
  }, [doctor_id_ID]);

  useEffect(() => {
    if (userUUID) {
      handleGetAppointments();
    }
  }, [userUUID]);

  const handleRemoveMedication = (medId) => {
    setMedications((meds) => meds.filter((med) => med.id !== medId));
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(false);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(true);

    // Update form data with patient_id and doctor_id
    setEditFormData({
      ...editFormData,
      patient_id: appointment.patient_id, // Assuming patient_id is part of the appointment data
      doctor_id: doctor_id_ID, // Assuming doctor_id is available in state
      appointment_id: appointment.appointmentId,
      severity: "", // Reset severity, or set any initial value
      medication: [], // Reset medication selection, or set it based on the appointment if available
    });
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
    setIsEditing(false);
    setShowAddMedicationForm(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleNewMedicationChange = (e) => {
    const { name, value } = e.target;
    setNewMedication((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDosageChange = (medicationId, dosage) => {
    setMedicationDosages((prevDosages) => ({
      ...prevDosages,
      [medicationId]: dosage,
    }));
  };

  const handleConfirmSession = () => {
    alert(`Session confirmed with details: ${JSON.stringify(formData)}`);
    setSelectedAppointment(null);
  };

  const handleConfirmEdit = () => {
    // Create the diagnosis description by appending selected medical conditions (name + description)
    const medicalConditionsText = (editFormData.medicalCondition || [])
      .map((condition) => `${condition.label || "Unnamed Condition"}`) // Safely access the 'label' of selected conditions
      .join(", "); // Join all selected conditions with a comma and space

    const diagnosisInfo = {
      patient_id: selectedAppointment.patient_id,
      diagnosis_description:
        (editFormData.diagnosis_description || "") +
        "," +
        medicalConditionsText, // Append selected medical conditions to description
      doctor_id: doctor_id_ID,
      severity: editFormData.severity || "",
      appointment_id: selectedAppointment.appointment_id,
    };

    // Format medication_info for submission
    const medicationInfo = editFormData.medication.map((med) => {
      const selectedMedication = medications.find(
        (m) => m.medication_id === med.value
      ); // Find medication by id
      return {
        patient_id: selectedAppointment.patient_id,
        medication_id: med.value, // medication_id from the selected medication
        doctor_id: doctor_id_ID,
        dosage: medicationDosages[med.value]?.dosage || "", // Dosage for this medication
        frequency: medicationDosages[med.value]?.frequency || "", // Frequency for this medication
        duration: medicationDosages[med.value]?.duration || "", // Duration for this medication
        price: selectedMedication?.price || "", // Add the price from the selected medication
      };
    });

    const formattedData = {
      diagnosis_info: diagnosisInfo,
      medication_info: medicationInfo,
      role: 1, // Assuming role is always 1
    };

    // Log the formatted data for debugging purposes

    // Submit the formatted data to the API (uncomment to use)
    const apiUrl = `/api/diagnosis`;
    console.log ("submitting diagnosis", formattedData) 
    
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData), // Pass the formatted data in the request body
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Submitting diagnosis failed");
        }
        return response.json();
      })
      .then((data) => {
        handleGetAppointments();
        handleCloseModal();
      })
      .catch((error) => {
        console.error("Error submitting diagnosis:", error);
      });
  };

  const handleAddMedication = () => {
    setShowAddMedicationForm(true);
  };

  const handleNewMedicationSubmit = () => {
    if (
      newMedication.name &&
      newMedication.description &&
      newMedication.price
    ) {
      setMedications([
        ...medications,
        { ...newMedication, id: medications.length + 1 },
      ]);
      setShowAddMedicationForm(false);
      setNewMedication({ name: "", description: "", price: "" });
    } else {
      alert("Please fill all fields!");
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "get_users_by_doctor":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Patients
            </h2>
            <p className="mt-4 text-gray-600">
              List of your patients will be shown here.
            </p>
          </div>
        );
      case "get_appointment":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Appointments
            </h2>
            {appointments.length === 0 ? (
              <p className="mt-4 text-gray-600">No appointments.</p>
            ) : (
              <table className="mt-4 min-w-full bg-white shadow-md rounded-lg p-4">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 text-left">Patient Name</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Time</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                    <th className="border px-4 py-2 text-left">Type</th>
                    <th className="border px-4 py-2 text-left">Action</th>

                    {/* <th className="border px-4 py-2 text-left">Patient ID</th> */}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td className="border px-4 py-2">
                        {appointment.patient_first_name +
                          " " +
                          appointment.patient_last_name}
                      </td>
                      {/* <td className="border px-4 py-2">{appointment.age}</td> */}
                      <td className="border px-4 py-2">
                        {new Date(appointment.date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {formatTime(appointment.time)}
                      </td>{" "}
                      <td className="border px-4 py-2">{appointment.status}</td>
                      <td className="border px-4 py-2">{appointment.type}</td>
                      {/* <td className="border px-4 py-2">
                        {appointment.patient_id}
                      </td> */}
                      <td className="border px-4 py-2">
                        {/* Conditional button based on status */}
                        {appointment.status === "pending" ? (
                          <>
                          
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Edit
                          </button>
                          <button
                        onClick={() => handleReassignAppointment(appointment)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Reassign
                      </button>
                          </>
                         
                          
                        ) : (
                          <button
                            onClick={() => handleViewAppointment(appointment)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case "profile":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Profile
            </h2>
            <form className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium">Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={profileData.specialty}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div> */}
              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={profileData.specialty}
                  onChange={handleProfileChange}
                  className="mt-1 p-2 border rounded w-full bg-white text-black"
                />
              </div>
              {/* Add more fields if necessary */}
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Update Profile
              </button>
            </form>
          </div>
        );
      case "view_medication":
        return (
          <div>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                Medications
              </h2>
              <button
                onClick={handleAddMedication}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                + Add Medication
              </button>
            </div>
            <table className="mt-4 min-w-full bg-white shadow-md rounded-lg p-4">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left">
                    Medication Name
                  </th>
                  <th className="border px-4 py-2 text-left">
                    More Description
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col h-screen">
        {/* Sidebar Header */}

        <div className="p-4 text-lg font-semibold text-white">
          {profileData.first_name && profileData.last_name ? (
            <>
              Welcome back, Dr. {profileData.first_name} {profileData.last_name}
            </>
          ) : (
            "Welcome back, Doctor"
          )}
          <p className="text-sm text-gray-400">Have a great day!</p>
        </div>
        {/* Navigation Menu */}
        <nav className="mt-4 flex flex-col space-y-1">
          <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md ${
              activePage === "get_appointment" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("get_appointment")}
          >
            Appointments
          </a>
          <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md ${
              activePage === "profile" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("profile")}
          >
            Profile
          </a>

          {/* <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md ${
              activePage === "view_medication" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("view_medication")}
          >
            View Medications
          </a> */}
        </nav>
        {/* Sidebar Footer */}
        <div className="mt-auto p-4">
          <button
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            onClick={handleLogout}
            disabled={loading} // Disable the button when loading
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-dashed rounded-full animate-spin mx-auto"></div>
            ) : (
              "Log Out"
            )}
          </button>
        </div>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 h-screen">
        {/* Page Content */}
        <main className="flex-grow p-6">{renderContent()}</main>
      </div>

      {/* Add Medication Modal */}
      {showAddMedicationForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Medication</h3>
            <div className="mb-2">
              <label className="block text-sm font-medium">
                Medication Name
              </label>
              <input
                type="text"
                name="name"
                value={newMedication.name}
                onChange={handleNewMedicationChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                name="description"
                value={newMedication.description}
                onChange={handleNewMedicationChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Price ($)</label>
              <input
                type="number"
                name="price"
                value={newMedication.price}
                onChange={handleNewMedicationChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="flex mt-4">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={handleNewMedicationSubmit}
              >
                Submit
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details or Edit Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">
              {isEditing ? "Add Diagnosis" : "Appointment Details"}
            </h3>
            {!isEditing ? (
              <>
                <p>
                  <strong>Date:</strong> {selectedAppointment.date}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.time}
                </p>
                <p>
                  <strong>Status:</strong> {selectedAppointment.status}
                </p>
                <p>
                  <strong>Type:</strong> {selectedAppointment.type}
                </p>

                <button
                  className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </>
            ) : (
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Severity</label>
                  <select
                    name="severity"
                    value={editFormData.severity}
                    onChange={handleFormChange}
                    className="mt-1 p-2 border rounded w-full bg-white text-black"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium">
                    Medication
                  </label>
                  <MultiSelect
                    options={medicationOptions}
                    value={editFormData.medication}
                    onChange={(selectedOptions) => {
                      setEditFormData((prevData) => ({
                        ...prevData,
                        medication: selectedOptions,
                      }));
                    }}
                    labelledBy="Select Medication"
                    hasSelectAll={false}  // Disable "Select All"

                  />

                  {/* Render dosage, frequency, and duration input fields for each selected medication */}
                  {editFormData.medication.map((med) => (
                    <div key={med.value} className="mt-2">
                      <label className="block text-sm font-medium">
                        Dosage, Frequency, and Duration for {med.label}
                      </label>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Dosage input */}
                        <input
                          type="text"
                          className="p-2 border rounded w-full bg-white text-black"
                          value={medicationDosages[med.value]?.dosage || ""}
                          onChange={(e) =>
                            handleDosageChange(med.value, {
                              ...medicationDosages[med.value],
                              dosage: e.target.value,
                            })
                          }
                          placeholder="Enter dosage"
                        />

                        {/* Frequency input */}
                        <input
                          type="number"
                          className="p-2 border rounded w-full bg-white text-black"
                          value={medicationDosages[med.value]?.frequency || ""}
                          onChange={(e) =>
                            handleDosageChange(med.value, {
                              ...medicationDosages[med.value],
                              frequency: e.target.value,
                            })
                          }
                          placeholder="Frequency"
                        />

                        {/* Duration input */}
                        <input
                          type="number"
                          className="p-2 border rounded w-full bg-white text-black"
                          value={medicationDosages[med.value]?.duration || ""}
                          onChange={(e) =>
                            handleDosageChange(med.value, {
                              ...medicationDosages[med.value],
                              duration: e.target.value,
                            })
                          }
                          placeholder="Duration (days)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium">
                    Medical Condition
                  </label>
                  <MultiSelect
                    options={medicationConditionOptions}
                    value={editFormData.medicalCondition}
                    onChange={(selectedOptions) =>
                      setEditFormData((prevData) => ({
                        ...prevData,
                        medicalCondition: selectedOptions,
                      }))
                    }
                    labelledBy="Select Conditions"
                    hasSelectAll={false}  // Disable "Select All"

                  />
                </div>

                {/* New input field for Diagnosis Description */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">
                    Diagnosis Description
                  </label>
                  <textarea
                    name="diagnosis_description"
                    value={editFormData.diagnosis_description || ""}
                    onChange={handleFormChange}
                    className="mt-1 p-2 border rounded w-full bg-white text-black"
                    placeholder="Enter detailed diagnosis description"
                  />
                </div>

                <div className="flex mt-4">
                  <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                    onClick={handleConfirmEdit}
                  >
                    Submit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
