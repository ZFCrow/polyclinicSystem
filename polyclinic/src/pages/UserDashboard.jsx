import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isUserLoggedIn } from '../lib/utils'; // Adjust the path based on your structure
// { json } from "body-parser";

const UserDashboard = () => {
  const [activePage, setActivePage] = useState("profile"); // Set default active tab to "profile"
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  // State to hold localStorage data
  const [userId, setUserId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [doctorId, setDoctorId] = useState(null);

  const [role_id_fk_ID, setrole_id_fk] = useState(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false); // Loading state for logout
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null); // Store the appointment being edited
  const [diagnosisDetails, setDiagnosisDetails] = useState(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [userData, setUserData] = useState({}); // State to hold user profile data

  // New state variables for profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [age, setAge] = useState(""); // Added age state
  const [billingTabActive, setBillingTabActive] = useState('current');

  useEffect(() => {
    // Retrieve and set user_id and patient_id from local storage
    const localUserId = localStorage.getItem("user_id");
    const localPatientId = localStorage.getItem("patient_id");
    const role_id_fk = localStorage.getItem("role_id_fk");
    const doctor_id = localStorage.getItem("doctor_id");

    setDoctorId(doctor_id);
    setUserId(localUserId);
    setPatientId(localPatientId);
    setrole_id_fk(role_id_fk);
  }, []);

  // New state variables for form inputs
  const [description, setDescription] = useState("");
  const [visitType, setVisitType] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [HistoryBilling, setHistoryBilling] = useState([]);

  const [joinedData, setJoinedData] = useState([]); // New state for joined data

  const joinAppointmentsAndBilling = () => {
    const joined = appointments.map((appointment) => {
      const matchingBilling = billing.find(
        (bill) => bill.appointment_id_fk === appointment.appointment_id
      );
      return {
        ...appointment,
        billing: matchingBilling || {}, // If no matching billing record, return empty object
      };
    });
    setJoinedData(joined);
  };

  useEffect(() => {
    if (!isUserLoggedIn()) {
      alert('Please log in first');
      navigate('/login'); // Redirect to login page
    }
  }, []);

  const handlePayBill = (
    billing_id,
    appointment_id,
    patient_id,
    amount_paid,
    payment_method
  ) => {
    // Set loading to true to indicate the payment process has started
    setLoading(true);

    const data = {
      payment_info: {
        amount_paid: amount_paid,
        payment_method: payment_method,
      },
    };

    fetch(`/api/billing/${billing_id}/${appointment_id}/${patient_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Payment failed");
        }
        return response.json();
      })
      .then((data) => {
        // After successful payment, call handleGetBilling to refresh the billing data
        handleGetBilling();
      })
      .then(() => {
        // Reload the page after fetching the updated billing data
        window.location.reload();
      })
      .catch((error) => {
        console.error("Payment failed:", error);
      })
      .finally(() => {
        // Stop loading after the payment and billing refresh is complete
        setLoading(false);
      });
  };

  const formatTime = (timeString) => {
    let [hours, minutes, seconds] = timeString.split(":"); // Split time into hours, minutes, and seconds
    let period = "AM";

    hours = parseInt(hours, 10);

    // Convert 24-hour time to 12-hour format
    if (hours >= 12) {
      period = "PM";
      if (hours > 12) hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    // Ensure minutes and seconds are two digits
    minutes = minutes.padStart(2, '0');
    seconds = seconds ? seconds.padStart(2, '0') : '00';

    return `${hours}:${minutes}:${seconds} ${period}`;
  };



  const handleGetBilling = () => {
    fetch(`/api/billing/${patientId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Billing failed");
        }
        return response.json();
      })
      .then((data) => {
        console.log("in billing data", data);  
        setHistoryBilling(data.message.history);
        setBilling(data.message.current);
      })
      .catch((error) => {
        console.error("Billing failed:", error);
      });
  };


  const handleGetUser = (user_id) => {
    fetch(`/api/user/${user_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Get Profile failed");
        }
        return response.json();
      })
      .then((data) => {
        setUserData(data.message.data);

        // Set state variables for profile fields
        const user = data.message.data;
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setEmail(user.email || "");
        setUsername(user.username || "");
        setAddress(user.role.address || "");
        setPhoneNumber(user.role.phone_number || "");
        setSpecialty(user.role.specialty || "");
        setAge(user.role.age || ""); // Added age from user.role.age
      })
      .catch((error) => {
        console.error("Get Profile failed:", error);
      });
  };

  const handleViewDetals = (patient_id_fk, appointment_id) => {
    fetch(`/api/diagnosis/${patient_id_fk}/${appointment_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Diagnosis failed");
        }
        return response.json();
      })
      .then((data) => {
        setDiagnosisDetails(data.message.data); // Store the diagnosis data
        setShowDiagnosisModal(true); // Show the diagnosis modal
      })
      .catch((error) => {
        console.error("Diagnosis failed:", error);
      });
  };

  const handleUpdateProfile = (event) => {
    event.preventDefault();

    const data = {
      user_info: {
        username: username,
        email: email,
        first_name: firstName,
        last_name: lastName,
        address: address,
        phone_number: phoneNumber,
        age: age,
        ...(userData.role.role_name === "Doctor" && { specialty: specialty }),
      },
    };

    fetch(`/api/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Profile update failed");
        }
        return response.json();
      })
      .then((data) => {
        // Refresh the user data
        handleGetUser(userId);
      })
      .catch((error) => {
        console.error("Profile update failed:", error);
      });
  };

  const renderProfileContent = () => {
    if (!userData || Object.keys(userData).length === 0) {
      return <p>Loading profile...</p>; // Display a loading text until data is fetched
    }

    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              First Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Age
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Last Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Address
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2">
              Phone Number
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded shadow bg-white text-black"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          {userData.role.role_name === "Doctor" && (
            <div className="mb-4">
              <label className="block text-gray-800 text-sm font-bold mb-2">
                Specialty
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded shadow bg-white text-black"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    );
  };


  const renderBillingContent = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Billing</h2>
        {/* Tabs */}
        <div className="flex mb-4">
          <button
            className={`px-4 py-2 mr-2 rounded ${billingTabActive === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            onClick={() => setBillingTabActive('current')}
          >
            Current
          </button>
          <button
            className={`px-4 py-2 rounded ${billingTabActive === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            onClick={() => setBillingTabActive('history')}
          >
            History
          </button>
        </div>

        {billingTabActive === 'current' ? (
          /* Render current billing filtered by pending status */
          joinedData.length === 0 ? (
            <p>No billing information available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedData
                .filter(item => item.billing.payment_status === "pending") // Only show pending bills
                .map((item, index) => (
                  <div
                    key={index}
                    className="bg-white shadow-md rounded-lg p-4 flex flex-col"
                  >
                    <div className="mb-2">
                      <strong>Date:</strong> {item.date}
                    </div>
                    <div className="mb-2">
                      <strong>Amount Due:</strong> ${item.billing.amount_due}
                    </div>
                    <div className="mb-2">
                      <strong>Payment Status:</strong> {item.billing.payment_status}
                    </div>
                    <div className="mt-auto">
                      {item.billing.payment_status === "pending" ? (
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          onClick={() =>
                            handlePayBill(
                              item.billing.billing_id,
                              item.appointment_id,
                              item.patient_id_fk,
                              item.billing.amount_due,
                              item.billing.payment_method
                            )
                          }
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-green-600 font-bold">Paid</span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )
        ) : (
          /* Render history billing */
          Array.isArray(HistoryBilling) && HistoryBilling.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HistoryBilling.map((bill, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-lg p-4 flex flex-col"
                >
                  <div className="mb-2">
                    <strong>Amount Paid:</strong> ${bill.amount_paid}
                  </div>
                  <div className="mb-2">
                    <strong>Payment Method:</strong> {bill.payment_method}
                  </div>
                  <div className="mb-2">
                    <strong>Payment Status:</strong> {bill.payment_status}
                  </div>
                </div>
              ))}
            </div>
            
          ) : (
            <p>No billing history available.</p>
          )
        )}
      </div>
    );
  };


  const handleBookAppointment = (event) => {
    event.preventDefault(); // Prevent default form submit action

    const formData = {
      appointment_info: {
        patient_id: patientId,
        date: appointmentDate,
        time: appointmentTime,
        status: "pending", // Default status
        type: visitType,
      }

    };

    const formData2 = {
      appointment_info: {
        date: appointmentDate,
        time: appointmentTime,
        type: visitType,
      },
    };



    //console.log(editingAppointment.patient_id);
    const requestMethod = isEditing ? "PUT" : "POST"; // Use PUT for updates and POST for new
    const url = isEditing
      ? `/api/userappointment/${editingAppointment.patient_id}/${editingAppointment.appointment_id}`
      : `/api/appointment`;

    console.log (url);
    console.log (JSON.stringify(isEditing ? formData2 : formData)); 
    fetch(url, {
      method: requestMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(isEditing ? formData2 : formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(isEditing ? "Update failed" : "Booking failed");
        }
        return response.json();
      })
      .then((data) => {

        setShowBookingForm(false); // Close the form on success
        setIsEditing(false); // Reset editing mode
        setEditingAppointment(null); // Reset editing appointment

        if (patientId && role_id_fk_ID) {
          handleGetAppointments(); // Refresh the appointment list
        }
      })
      .catch((error) => {
        console.error(isEditing ? "Update failed" : "Booking failed", error);
      });
  };

  const handleDeleteAppointment = (patient_id, appointment_id) => {
    try {
      fetch(`/api/appointment/${patient_id}/${appointment_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Deletion failed");
          return response.json();
        })
        .then((data) => {
          if (patientId && role_id_fk_ID) {
            handleGetAppointments();
          }
        })
        .catch((error) => {
          console.error("Deletion failed:", error);
        });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleGetAppointments = () => {
    fetch(`/api/appointment/${patientId}/${role_id_fk_ID}`, {
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
        console.log(data);
        if (data && data.message.appointments && Array.isArray(data.message.appointments)) {
          setAppointments(data.message.appointments);
        } else {
          //console.error("Invalid data format:", data.message);
          console.log("No appointments found");
        }
      })
      .catch((error) => {
        console.error("Fetching appointments failed:", error);
      });
  };

  useEffect(() => {
    if (userId) {
      handleGetBilling();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      handleGetUser(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (
      Array.isArray(appointments) && appointments.length > 0 &&
      Array.isArray(billing) && billing.length > 0
    ) {
      joinAppointmentsAndBilling();
    }
  }, [appointments, billing]);

  useEffect(() => {
    if (patientId && role_id_fk_ID) {
      handleGetAppointments();
    }
  }, [patientId, role_id_fk_ID]);

  const openModal = (appointment) => {
    setSelectedAppointment(appointment); // This sets the entire appointment object
    setShowModal(true);
  };

  const handleLogout = () => {
    setLoading(true); // Start loading
    setTimeout(() => {
      // Simulate logout process
      localStorage.clear();
      setLoading(false); // Stop loading
      navigate("/login"); // Redirect to login page after logout
    }, 2000); // Simulate 2 seconds delay for logout
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  const openBookingForm = () => {
    setShowBookingForm(true);
  };

  const closeBookingForm = () => {
    setShowBookingForm(false);
    setIsEditing(false); // Reset editing state
    setEditingAppointment(null); // Clear editing appointment data

    // Reset form fields
    setVisitType("");
    setAppointmentDate("");
    setAppointmentTime("");
  };

  const openUpdateModal = (appointment) => {
    setIsEditing(true); // We're editing an appointment
    console.log(appointment); // Log the appointment data 
    setEditingAppointment(appointment); // Store the appointment being edited

    // Pre-fill the form with the appointment data
    setVisitType(appointment.type);
    setAppointmentDate(appointment.date);
    setAppointmentTime(appointment.time);
    setSelectedAppointment(appointment);

    setShowBookingForm(true); // Show the form modal
  };

  const renderContent = () => {
    switch (activePage) {
      case "profile":
        return renderProfileContent();
      case "billing":
        return renderBillingContent();
      case "appointments":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Appointments
            </h2>
            {appointments.length === 0 ? (
              <p>No appointments available.</p> // Show this when there are no appointments
            ) : (
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Time</th>
                    {/* <th className="border px-4 py-2 text-left">Doctor ID</th> */}
                    {/* <th className="border px-4 py-2 text-left">Patient ID</th> */}
                    <th className="border px-4 py-2 text-left">Status</th>
                    <th className="border px-4 py-2 text-left">Type</th>
                    <th className="border px-4 py-2 text-left">Action</th>

                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
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
                      <td className="border px-4 py-2">
                        {appointment.status === "pending" ? (
                          <>
                            <span className="text-yellow-600">
                              Waiting for doctor to complete
                            </span>
                            <button
                              onClick={() => openUpdateModal(appointment)}
                              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 ml-2 rounded"
                            >
                              Update
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAppointment(
                                  appointment.patient_id,
                                  appointment.appointment_id
                                )
                              }
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 ml-2 rounded"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              handleViewDetals(
                                appointment.patient_id,
                                appointment.appointment_id
                              )
                            }
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          >
                            View Details
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
          {userData.first_name && userData.username ? (
            <>
              Welcome back, {userData.first_name} {userData.username}
            </>
          ) : (
            "Welcome back"
          )}
          <p className="text-sm text-gray-400">Have a great day!</p>
        </div>
        {/* Navigation Menu */}
        <nav className="mt-4 flex flex-col space-y-1">
          <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${activePage === "profile" ? "bg-gray-800" : ""
              }`}
            onClick={() => setActivePage("profile")}
          >
            Profile
          </a>
          <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${activePage === "appointments" ? "bg-gray-800" : ""
              }`}
            onClick={() => setActivePage("appointments")}
          >
            Appointments
          </a>
          <a
            href="#"
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${activePage === "billing" ? "bg-gray-800" : ""
              }`}
            onClick={() => setActivePage("billing")}
          >
            Billing
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4">
          <button
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            onClick={handleLogout}
            disabled={loading} // Disable button while loading
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
        <main className="flex-grow p-6">
          <div className="flex justify-between items-center mb-4">
            {activePage === "appointments" && (
              <button
                onClick={openBookingForm}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                + Book Appointment
              </button>
            )}
          </div>
          {renderContent()}
        </main>
      </div>

      {/* Modal for Appointment Details */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Appointment Details</h2>
            <table className="min-w-full bg-white border-collapse">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Field</th>
                  <th className="border px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">Appointment ID</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.appointment_id}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Date</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.date}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Time</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.time}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Doctor ID</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.doctor_id_fk}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Patient ID</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.patient_id_fk}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Status</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.status}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Type</td>
                  <td className="border px-4 py-2">
                    {selectedAppointment.type}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Book an Appointment</h2>
            <form onSubmit={handleBookAppointment}>
              <div className="mb-4">
                <label className="block text-gray-800 text-sm font-bold mb-2">
                  Type of Visit
                </label>
                <select
                  className="w-full px-3 py-2 border rounded shadow bg-white text-black"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                >
                  <option value="">Select a visit type</option>
                  <option value="Medical Consultation">
                    Medical Consultation
                  </option>
                  <option value="Checkup">Checkup</option>
                  <option value="Vaccination">Vaccination</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-800 text-sm font-bold mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded shadow bg-white text-black"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-800 text-sm font-bold mb-2">
                  Select Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded shadow bg-white text-black"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeBookingForm}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isEditing ? "Update Appointment" : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnosis Modal */}
      {showDiagnosisModal && diagnosisDetails && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Diagnosis Details</h2>
            {diagnosisDetails.map((diagnosis, index) => (
              <div key={index}>
                <p>
                  <strong>Diagnosis Date:</strong> {diagnosis.diagnosis_date}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {diagnosis.diagnosis_description}
                </p>

                {/* <p>
                  <strong>Medications:</strong> {diagnosis.medications}
                </p> */}
                <ul className="list-disc pl-5">
                  {diagnosis.medications.map((medication, idx) => (
                    <li key={idx} className="mb-2">
                      <p>
                        <strong>Name:</strong> {medication.name}
                      </p>
                      <p>
                        <strong>Dosage:</strong> {medication.dosage}
                      </p>
                      <p>
                        <strong>Frequency:</strong> {medication.frequency}
                      </p>
                      <p>
                        <strong>Duration:</strong> {medication.duration}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDiagnosisModal(false)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
