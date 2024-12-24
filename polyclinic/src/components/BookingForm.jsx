import React from 'react';
import { useForm } from 'react-hook-form';

const BookingForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const formattedTomorrow = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm p-8 bg-gray-900 rounded-lg shadow-lg">
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

      {/* Date and Time Field */}
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
  );
};

export default BookingForm;
