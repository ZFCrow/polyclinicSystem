import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Appointments = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({});
  const navigate = useNavigate(); // Create the navigate function

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 2);
  const formattedTomorrow = tomorrow.toISOString().split('T')[0];

  const onSubmit = async (data) => {
    const appointmentDetails = {
      patient_id_fk: 507, // Replace with the actual patient ID from your database
      date: data.date,
      time: data.time,
      status: "pending", // Default status for new appointments
      type: data.visitType,
    };
  
    try {
      const response = await fetch("http://localhost:5001/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentDetails),
      });
  
      const result = await response.json();
      if (response.status === 201) {
        setBookingDetails(result.appointmentData);
        setIsSubmitted(true);
      } else {
        console.error("Error booking appointment:", result.message);
        alert(result.message || "Failed to book appointment. Please try again.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("An error occurred while booking the appointment. Please try again.");
    }
  };
  

  const handleViewAppointment = () => {
    navigate('/'); // Use navigate to redirect
  };

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-800">
      <div className="w-full max-w-sm p-8 bg-gray-900 rounded-lg shadow-lg">
        {isSubmitted ? (
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-white mb-6">Booking Completed!</h2>
            <p className="text-lg text-white mb-4">Your appointment is set for:</p>
            <p className="text-md text-indigo-300">{bookingDetails.date} at {bookingDetails.time}</p>
            <button onClick={() => setIsSubmitted(false)} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">
              Make Another Booking
            </button>
            <button onClick={handleViewAppointment} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400">
                View My Appointment
              </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <h2 className="text-3xl font-semibold text-white mb-6 text-center">Book an Appointment</h2>
            
            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="name">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Phone Number Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Please enter a valid 10-digit phone number',
                  },
                })}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            {/* Problem Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="problem">
                Describe Your Problem
              </label>
              <textarea
                id="problem"
                {...register('problem', { required: 'Please describe your problem' })}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of your issue"
              />
              {errors.problem && <p className="text-red-500 text-sm mt-1">{errors.problem.message}</p>}
            </div>

            {/* Visit Type Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="visitType">
                Type of Visit
              </label>
              <select
                id="visitType"
                {...register('visitType', { required: 'Please select a visit type' })}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a visit type</option>
                <option value="consultation">Consultation</option>
                <option value="checkup">Vaccination</option>
                <option value="emergency">Health Checkup</option>
              </select>
              {errors.visitType && <p className="text-red-500 text-sm mt-1">{errors.visitType.message}</p>}
            </div>

            {/* Date Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="date">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { required: 'Please select a date' })}
                min={formattedTomorrow} // Only allow dates from tomorrow onwards
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
            </div>

            {/* Time Field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="time">
                Select Time
              </label>
              <input
                type="time"
                id="time"
                {...register('time', { required: 'Please select a time' })}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
            </div>

            <div className="mb-6">
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">
                Book Appointment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Appointments;
