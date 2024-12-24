import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import image from "../assets/images.jpg";

const Registration = () => {
  const navigate = useNavigate();

  // States to capture user input and control loading, success, and error states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Update input changes
  const handleInputChange = (event) => {
    const { id, value } = event.target;
    let formattedValue = value;

    if (id === "age" && value !== "") {
      formattedValue = Number(value);
    }

    setFormData((prev) => ({ ...prev, [id]: formattedValue }));
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = "Age should be between 18 and 100";
    }
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.phone.match(/^\d{8}$/)) {
      newErrors.phone = "Phone number should be 8 digits";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Enter a valid email address";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password should be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleRegistration = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true); // Start loading
    setErrorMessage(""); // Clear any previous errors
    setSuccessMessage(false); // Reset success message

    if (import.meta.env.VITE_APP_USE_SQL === "TRUE") {
      try {
        const user_info = {
          role_id: 2,
          username: formData.username,
          password_hash: formData.password,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
        };

        const role_info = {
          age: formData.age,
          gender: formData.gender,
          phone_number: formData.phone,
          address: formData.address,
        };

        // Submit the data
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_info, role_info }),
        });

        if (!response.ok) {
          throw new Error("Registration failed");
        }

        const data = await response.json();

        if (data.message.status === "success") {
          setSuccessMessage(true); // Show success message
          handleLogIn(formData.email, formData.password); // Auto log in
        } else if (
          data.message.message ===
          "User already exists with this username or email."
        ) {
          setErrorMessage(
            "Account already registered. Please go to the login page."
          );
        }
      } catch (error) {
        console.error("Registration failed:", error);
        setErrorMessage("Registration failed. Please try again.");
      } finally {
        setLoading(false); // Stop loading
      }
    } else {
      try {
        const url = "http://localhost:5001/register";

        // Create the user payload
        const userPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password, // Ensure this is hashed on the backend
          role_id: 2, // Assuming role_id 2 is a standard user
          age: formData.age,
          gender: formData.gender,
          phoneNumber: formData.phone,
          address: formData.address,
        };

        // Send the registration data to the server
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userPayload),
        });

        if (!response.ok) {
          throw new Error("Registration failed");
        }

        const data = await response.json();
        console.log("this is the respon for registartion ", data);

        if (data.message === "success") {
          navigate("/userdashboard");
        }
      } catch (error) {
        console.error("Registration failed:", error);
        setErrorMessage("Registration failed. Please try again.");
      } finally {
        setLoading(false); // Stop loading
      }
    }
  };

  const handleLogIn = (email, password) => {
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login failed");
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem("patient_id", data.message.user.patient_id);
        localStorage.setItem("role_id_fk", data.message.user.role_id_fk);
        localStorage.setItem("user_id", data.message.user.user_id);

        // Redirect based on role
        switch (data.message.user.role_id_fk) {
          case 1:
            navigate("/doctordashboard");
            break;
          case 2:
            navigate("/userdashboard");
            break;
          case 3:
            navigate("/admindashboard");
            break;
          default:
            navigate("/home");
            break;
        }
      })
      .catch((error) => {
        console.error("Login failed:", error);
        setErrorMessage("Login failed. Please try again.");
      });
  };

  return (
    <div className="h-screen w-screen flex">
      <div
        className="w-1/2 flex flex-col justify-between p-8 text-white"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "multiply",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <div>
          <h1 className="text-4xl font-bold mb-8">Polyclinic Inc</h1>
          <p className="text-lg italic">"INF2003-Databases-Project-1"</p>
          <p className="mt-4 font-semibold">P2-Group 13</p>
        </div>
      </div>

      <div className="w-1/2 flex flex-col justify-center items-center bg-gray-800 p-8">
        <div className="w-full max-w-2xl mx-auto bg-gray-800 p-8 text-white rounded-lg">
          <h2 className="text-3xl font-semibold mb-6">Create an account</h2>
          <form onSubmit={handleRegistration} className="space-y-4">
            {/* Input fields */}
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label htmlFor="firstName" className="block text-sm mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-gray-700 rounded ${
                    errors.firstName ? "border border-red-500" : ""
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs italic">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="w-1/2">
                <label htmlFor="lastName" className="block text-sm mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-gray-700 rounded ${
                    errors.lastName ? "border border-red-500" : ""
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs italic">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="w-1/3">
                <label htmlFor="username" className="block text-sm mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="john_doe"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-gray-700 rounded ${
                    errors.username ? "border border-red-500" : ""
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs italic">
                    {errors.username}
                  </p>
                )}
              </div>
              <div className="w-1/3">
                <label htmlFor="age" className="block text-sm mb-1">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  placeholder="30"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-gray-700 rounded ${
                    errors.age ? "border border-red-500" : ""
                  }`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs italic">{errors.age}</p>
                )}
              </div>
              <div className="w-1/3">
                <label htmlFor="gender" className="block text-sm mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-gray-700 rounded ${
                    errors.gender ? "border border-red-500" : ""
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs italic">{errors.gender}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                placeholder="12345678"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-2 bg-gray-700 rounded ${
                  errors.phone ? "border border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs italic">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                placeholder="1234 Main St"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full p-2 bg-gray-700 rounded ${
                  errors.address ? "border border-red-500" : ""
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs italic">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 bg-gray-700 rounded ${
                  errors.email ? "border border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs italic">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter a strong password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full p-2 bg-gray-700 rounded ${
                  errors.password ? "border border-red-500" : ""
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs italic">{errors.password}</p>
              )}
            </div>

            {/* Loading, Success, Error messages */}
            {loading ? (
              <div className="mb-4 flex justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : successMessage ? (
              <div className="mb-4 flex justify-center">
                <div className="text-green-500 text-2xl">
                  ✔ Registration successful!
                </div>
              </div>
            ) : (
              <>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                >
                  Sign Up
                </button>

                <div className="flex justify-center items-center my-4">
                  <span className="text-gray-400">OR</span>
                </div>

                <Link to="/login" className="w-full">
                  <button className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                    Go to Login
                  </button>
                </Link>
              </>
            )}

            {errorMessage && (
              <div className="mb-4 text-red-500 text-center">
                {errorMessage}
              </div>
            )}

            <div className="text-center mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
