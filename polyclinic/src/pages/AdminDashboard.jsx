import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isUserLoggedIn } from '../lib/utils'; // Adjust the path based on your structure

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("view_user");
  const [usersAll, setUsersAll] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    specialty: "",
  });

  const [loading, setLoading] = useState(true); // Track loading state
  const [noData, setNoData] = useState(false); // Track no data state
  const navigate = useNavigate();

  const [patientId, setPatientId] = useState(null);
  const [role_id_fk_ID, setrole_id_fk] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingAddUser, setLoadingAddUser] = useState(false);
  const [loadingAddCondition, setLoadingAddCondition] = useState(false);

  // Pagination states for users
  const [currentPageUser, setCurrentPageUser] = useState(1); // For users pagination
  const itemsPerPageUser = 10; // Items per page for users
  const [totalUserCount, setTotalUserCount] = useState(0); // Total number of users

  // Pagination states for medical conditions
  const [currentPageCondition, setCurrentPageCondition] = useState(1); // For conditions pagination
  const itemsPerPageCondition = 5; // Items per page for conditions

  // State for the new medical condition form
  const [newCondition, setNewCondition] = useState({
    name: "",
    description: "",
  });

  // New state variable for medical conditions
  const [medicalConditions, setMedicalConditions] = useState([]);

  useEffect(() => {
    if (!isUserLoggedIn()) {
      alert('Please log in first');
      navigate('/login'); // Redirect to login page
    }
  }, []);

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

  const getuser = (pageNumber, itemsPerPage) => {
    const role_id = localStorage.getItem("role_id_fk");
    setLoading(true); // Start loading
    fetch(`/api/users/${role_id}/${pageNumber}/${itemsPerPage}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return response.json();
      })
      .then((data) => {
        const usersData = data?.message?.users;

        if (usersData && Array.isArray(usersData) && usersData.length > 0) {
          setTotalUserCount(usersData[0].total_users);
          setUsersAll(usersData.slice(1)); // Remove the first item if needed
          setNoData(false); // Indicate that there is data
        } else {
          setTotalUserCount(0);
          setUsersAll([]); // Set an empty array for users
          setNoData(true); // Indicate no data found
        }
      })
      .catch((error) => {
        console.error("Request failed:", error);
      })
      .finally(() => setLoading(false)); // Stop loading when request completes
  };

  // Function to fetch medical conditions
  const getMedicalConditions = () => {
    fetch(`/api/medical_condition/3`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch medical conditions");
        return response.json();
      })
      .then((data) => {
        setMedicalConditions(data.message); // Adjust based on actual response format
      })
      .catch((error) => {
        console.error("Error fetching medical conditions:", error);
      });
  };

  // Fetch medical conditions when the active page changes to 'view_medical_condition'
  useEffect(() => {
    if (activePage === "view_medical_condition") {
      getMedicalConditions();
    }
  }, [activePage]);

  // Fetch users when currentPageUser changes
  useEffect(() => {
    getuser(currentPageUser, itemsPerPageUser);
  }, [currentPageUser]);

  const handleCreateUser = async (event) => {
    event.preventDefault();

    // Validate if any field is empty
    if (
      !newUser.username ||
      !newUser.password ||
      !newUser.email ||
      !newUser.firstName ||
      !newUser.lastName ||
      !newUser.phoneNumber ||
      !newUser.specialty
    ) {
      alert("Please fill in all the required fields.");
      return; // Exit if validation fails
    }

    setLoadingAddUser(true); // Start loading
    try {
      const user_info = {
        role_id: 1,
        username: newUser.username,
        password_hash: newUser.password,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
      };

      const role_info = {
        phone_number: newUser.phoneNumber,
        address: newUser.address,
        specialty: newUser.specialty,
      };

      fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_info, role_info }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Registration failed");
          return response.json();
        })
        .then((data) => {
          if (data.message.status === "success") {
            alert("User added to the database");
            setNewUser({
              username: "",
              email: "",
              password: "",
              role: "",
              firstName: "",
              lastName: "",
              phoneNumber: "",
              specialty: "",
            });
            setActivePage("view_user");
            getuser(currentPageUser, itemsPerPageUser);
          } else if (
            data.message.message ===
            "User already exists with this username or email."
          ) {
            alert("Account already registered. Please go to the login page.");
          }
        })
        .catch((error) => {
          console.error("Registration failed:", error);
        })
        .finally(() => {
          setLoadingAddUser(false); // Stop loading
        });
    } catch (error) {
      console.error("Validation failed:", error);
      setLoadingAddUser(false); // Stop loading in case of an error
    }
  };

  const handleDeleteUser = async (userId) => {
    setLoadingDelete(true); // Start loading
    try {
      fetch(`/api/user/${userId}`, {
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
          getuser(currentPageUser, itemsPerPageUser); // Refresh the current page
        })
        .catch((error) => {
          console.error("Deletion failed:", error.message);
        })
        .finally(() => {
          setLoadingDelete(false); // Stop loading
        });
    } catch (error) {
      console.error("Validation failed:", error);
      setLoadingDelete(false); // Stop loading in case of an error
    }
  };

  const handleAddConditionInputChange = (e) => {
    const { name, value } = e.target;
    setNewCondition((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleAddUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevState) => ({ ...prevState, [name]: value }));
  };

  // Function to handle adding a new medical condition
  const handleAddMedicalCondition = (event) => {
    event.preventDefault();

    // Validate if any field is empty
    if (!newCondition.name || !newCondition.description) {
      alert("Please fill in all the required fields.");
      return; // Exit if validation fails
    }
    setLoadingAddCondition(true); // Start loading
    const data = {
      condition_info: {
        name: newCondition.name,
        description: newCondition.description,
      },
    };
    fetch("/api/medical_condition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to add medical condition");
        return response.json();
      })
      .then((data) => {
        alert("Medical condition added successfully");
        setNewCondition({
          name: "",
          description: "",
        });
      })
      .catch((error) => {
        console.error("Error adding medical condition:", error);
        alert("Error adding medical condition");
      })
      .finally(() => {
        setLoadingAddCondition(false); // Stop loading
      });
  };

  const handleDeleteCondition = (conditionId) => {

    setLoadingDelete(true); // Start loading

    // Send DELETE request to the API to delete the medical condition
    fetch(`/api/medical_condition/${conditionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete medical condition");
        }
        return response.json();
      })
      .then((data) => {
        alert("Medical condition deleted successfully");
        getMedicalConditions(); // Refresh medical conditions list after deletion
      })
      .catch((error) => {
        console.error("Error deleting medical condition:", error);
        alert("Error deleting medical condition");
      })
      .finally(() => {
        setLoadingDelete(false); // Stop loading after the process is complete
      });
  };

  const handleLogout = () => {
    setLoading(true); // Start loading spinner

    // Simulate a delay (e.g., API call)
    setTimeout(() => {
      localStorage.clear(); // Clear user data from local storage
      setLoading(false); // Stop loading spinner
      navigate("/login"); // Redirect to the login page
    }, 2000); // Simulate a 2-second delay for demonstration purposes
  };

  const renderContent = () => {
    if (activePage === "view_user") {
      // Calculate total pages based on totalUserCount
      const totalPagesUser = Math.ceil(totalUserCount / itemsPerPageUser);

      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">View Users</h2>
          </div>
          <div className="relative min-w-full bg-white shadow-md rounded-lg overflow-hidden min-h-[200px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : noData ? (
              <div className="p-4 text-center text-gray-500">
                No data available.
              </div>
            ) : (
              <div>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2 text-left">Username</th>
                      <th className="border px-4 py-2 text-left">Role ID</th>
                      <th className="border px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersAll.map((user) => (
                      <tr key={user.user_id}>
                        <td className="border px-4 py-2">{user.username}</td>
                        <td className="border px-4 py-2">{user.role_id}</td>
                        <td className="border px-4 py-2">
                          {loadingDelete ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                <div className="flex justify-center mt-4">
                  <button
                    className="px-3 py-1 mx-1 bg-gray-300 rounded"
                    onClick={() => setCurrentPageUser(1)}
                    disabled={currentPageUser === 1}
                  >
                    First
                  </button>
                  <button
                    className="px-3 py-1 mx-1 bg-gray-300 rounded"
                    onClick={() => setCurrentPageUser(currentPageUser - 1)}
                    disabled={currentPageUser === 1}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 mx-1">
                    Page {currentPageUser} of {totalPagesUser}
                  </span>
                  <button
                    className="px-3 py-1 mx-1 bg-gray-300 rounded"
                    onClick={() => setCurrentPageUser(currentPageUser + 1)}
                    disabled={currentPageUser === totalPagesUser}
                  >
                    Next
                  </button>
                  <button
                    className="px-3 py-1 mx-1 bg-gray-300 rounded"
                    onClick={() => setCurrentPageUser(totalPagesUser)}
                    disabled={currentPageUser === totalPagesUser}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else if (activePage === "add_user") {
      return (
        <div>
          <h3 className="text-2xl font-semibold mb-4">Add New Doctor</h3>
          <form onSubmit={handleCreateUser}>
            <div className="mb-2">
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />

              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />

              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />

              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="firstName"
                value={newUser.firstName}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={newUser.lastName}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={newUser.phoneNumber}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Specialty</label>
              <input
                type="text"
                name="specialty"
                value={newUser.specialty}
                onChange={handleAddUserInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>

            <div className="flex mt-4">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                disabled={loadingAddUser} // Disable button while loading
              >
                {loadingAddUser ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                  "Submit"
                )}
              </button>

              <button
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setActivePage("view_user")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    } else if (activePage === "add_medical_condition") {
      return (
        <div>
          <h3 className="text-2xl font-semibold mb-4">
            Add New Medical Condition
          </h3>
          <form onSubmit={handleAddMedicalCondition}>
            <div className="mb-2">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={newCondition.name}
                onChange={handleAddConditionInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={newCondition.description}
                onChange={handleAddConditionInputChange}
                className="mt-1 p-2 border rounded w-full bg-white text-black"
              ></textarea>
            </div>

            <div className="flex mt-4">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                disabled={loadingAddCondition} // Disable button while loading
              >
                {loadingAddCondition ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                  "Submit"
                )}
              </button>

              <button
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setActivePage("view_user")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    } else if (activePage === "view_medical_condition") {
      // Pagination calculations for medical conditions
      const totalPagesCondition = Math.ceil(
        medicalConditions.length / itemsPerPageCondition
      );
      const currentDataConditions = medicalConditions.slice(
        (currentPageCondition - 1) * itemsPerPageCondition,
        currentPageCondition * itemsPerPageCondition
      );

      return (
        <div>
          <h3 className="text-2xl font-semibold mb-4">Medical Conditions</h3>
          {currentDataConditions.length === 0 ? (
            <p>No medical conditions available.</p>
          ) : (
            <div>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Description</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDataConditions.map((condition) => (
                    <tr key={condition.condition_id}>
                      <td className="border px-4 py-2">
                        {condition.condition_id}
                      </td>
                      <td className="border px-4 py-2">{condition.name}</td>
                      <td className="border px-4 py-2">
                        {condition.description}
                      </td>
                      <td className="border px-4 py-2">
                        {loadingDelete ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeleteCondition(condition.condition_id)
                            }
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex justify-center mt-4">
                <button
                  className="px-3 py-1 mx-1 bg-gray-300 rounded"
                  onClick={() => setCurrentPageCondition(1)}
                  disabled={currentPageCondition === 1}
                >
                  First
                </button>
                <button
                  className="px-3 py-1 mx-1 bg-gray-300 rounded"
                  onClick={() =>
                    setCurrentPageCondition(currentPageCondition - 1)
                  }
                  disabled={currentPageCondition === 1}
                >
                  Previous
                </button>
                <span className="px-3 py-1 mx-1">
                  Page {currentPageCondition} of {totalPagesCondition}
                </span>
                <button
                  className="px-3 py-1 mx-1 bg-gray-300 rounded"
                  onClick={() =>
                    setCurrentPageCondition(currentPageCondition + 1)
                  }
                  disabled={currentPageCondition === totalPagesCondition}
                >
                  Next
                </button>
                <button
                  className="px-3 py-1 mx-1 bg-gray-300 rounded"
                  onClick={() => setCurrentPageCondition(totalPagesCondition)}
                  disabled={currentPageCondition === totalPagesCondition}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col h-screen">
        {/* Sidebar Header */}
        <div className="p-4 text-lg font-semibold text-white">
          Welcome, Admin Dashboard
          <p className="text-sm text-gray-400">Have a great day!</p>
        </div>
        {/* Navigation Menu */}
        <nav className="mt-4 flex flex-col space-y-1">
          <button
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${
              activePage === "view_user" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("view_user")}
          >
            View User
          </button>
          <button
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${
              activePage === "add_user" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("add_user")}
          >
            Add Doctor
          </button>
          <button
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${
              activePage === "add_medical_condition" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("add_medical_condition")}
          >
            Add Medical Condition
          </button>
          {/* New button for viewing medical conditions */}
          <button
            className={`px-4 py-2 hover:bg-gray-800 rounded-md text-white ${
              activePage === "view_medical_condition" ? "bg-gray-800" : ""
            }`}
            onClick={() => setActivePage("view_medical_condition")}
          >
            View Medical Condition
          </button>
        </nav>

        {/* Sidebar Footer */}
        <button
          className="w-full px-4 py-2 mt-auto bg-red-600 hover:bg-red-700 text-white rounded-md"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-dashed rounded-full animate-spin mx-auto"></div>
          ) : (
            "Log Out"
          )}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen p-6">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
