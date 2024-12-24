import React, { useState } from "react";

// Main Bill Page
const BillPage = ({ onSelectBill }) => {
  const [activeTab, setActiveTab] = useState("current");

  // Mock data for current bills
  const bills = [
    {
      id: 1,
      hospitalName: "National University Polyclinics",
      amount: 22.45,
      date: "2024-01-03",
      invoice: "0F24002204",
    },
    {
      id: 2,
      hospitalName: "National University Polyclinics",
      amount: 47.85,
      date: "2023-12-09",
      invoice: "0F23306097",
    },
    {
      id: 3,
      hospitalName: "National University Polyclinics",
      amount: 0.0,
      date: "2024-03-15",
      invoice: "0F24567023",
    },
  ];

  return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-start py-10">
      <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow-lg">
        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 ${
              activeTab === "current"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            } focus:outline-none`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            } focus:outline-none`}
          >
            History
          </button>
        </div>

        {/* Current Tab */}
        {activeTab === "current" && (
          <div>
            <div className="mt-4 space-y-4">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => onSelectBill(bill)} // Correctly handle the click event
                  className="flex justify-between items-center p-4 border rounded cursor-pointer hover:border-blue-500"
                >
                  <div>
                    <p className="text-gray-700 font-semibold">
                      {bill.hospitalName}
                    </p>
                    <p className="text-gray-600">Invoice: {bill.invoice}</p>
                  </div>
                  <div className="flex items-center">
                    <p
                      className={`text-lg font-semibold ${
                        bill.amount > 0 ? "text-green-500" : "text-gray-600"
                      }`}
                    >
                      S${bill.amount.toFixed(2)}
                    </p>
                    <span className="ml-2 text-gray-600">{">"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Payment Page Component
const PaymentPage = ({ bill, onBack }) => {
  const [payerInfo, setPayerInfo] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
  });
  const [formValid, setFormValid] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null); // State for the selected payment option

  // Handler to check if all fields are filled
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayerInfo({ ...payerInfo, [name]: value });

    // Validate if all fields are filled
    const isValid =
      payerInfo.fullName && payerInfo.contactNumber && payerInfo.email;
    setFormValid(isValid);
  };

  const handlePaymentSelection = (paymentOption) => {
    if (formValid) {
      setSelectedPayment(paymentOption);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-start py-10">
      <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Payment Information</h2>

        <div className="border p-4 rounded-lg">
          <p className="text-gray-700 font-semibold">Grand Total</p>
          <p className="text-green-500 text-lg font-semibold mb-4">
            S${bill.amount.toFixed(2)}
          </p>

          <p className="text-gray-700 font-semibold">Payor Information</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              value={payerInfo.fullName}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="contactNumber"
              placeholder="Contact Number"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              value={payerInfo.contactNumber}
              onChange={handleInputChange}
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-black bg-white"
            value={payerInfo.email}
            onChange={handleInputChange}
          />
          <p className="text-xs text-gray-500 mb-4">
            *Payment receipt will be sent to this email.
          </p>

          <p className="text-gray-700 font-semibold">Select Payment Option</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div
              className={`border p-4 flex items-center justify-center rounded cursor-pointer ${
                formValid && selectedPayment === "VISA"
                  ? "border-blue-500 bg-blue-50" // Highlight the selected option
                  : formValid
                  ? "hover:border-blue-500"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => handlePaymentSelection("VISA")}
            >
              <p>VISA</p>
            </div>
            <div
              className={`border p-4 flex items-center justify-center rounded cursor-pointer ${
                formValid && selectedPayment === "AMERICAN EXPRESS"
                  ? "border-blue-500 bg-blue-50" // Highlight the selected option
                  : formValid
                  ? "hover:border-blue-500"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => handlePaymentSelection("AMERICAN EXPRESS")}
            >
              <p>AMERICAN EXPRESS</p>
            </div>
          </div>
          {selectedPayment && (
            <div className="border p-4 rounded-lg mt-4">
              <h3 className="text-lg font-semibold mb-4">
                Enter {selectedPayment} Details
              </h3>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name on Card</label>
                <input
                  type="text"
                  placeholder="Name on Card"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">CVV/CVV2</label>
                  <input
                    type="text"
                    placeholder="CVV/CVV2"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <div className="flex space-x-2">
                    <select className="w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
                      <option>Month</option>
                      <option>01</option>
                      <option>02</option>
                      <option>03</option>
                      {/* Add more months */}
                    </select>
                    <select className="w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
                      <option>Year</option>
                      <option>2024</option>
                      <option>2025</option>
                      {/* Add more years */}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
          >
            Back
          </button>

          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded">
            Pay
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Application
const App = () => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [isPaymentPage, setIsPaymentPage] = useState(false); // Track if the user is on the payment page

  return (
    <div>
      {!isPaymentPage && selectedBill ? (
        <BillDetailPage
          bill={selectedBill}
          onBack={() => setSelectedBill(null)}
          onPay={() => setIsPaymentPage(true)} // When "Pay" is clicked, navigate to the payment page
        />
      ) : isPaymentPage ? (
        <PaymentPage
          bill={selectedBill}
          onBack={() => setIsPaymentPage(false)} // Allow going back to the detail page
        />
      ) : (
        <BillPage onSelectBill={setSelectedBill} />
      )}
    </div>
  );
};

// Bill Detail Page
const BillDetailPage = ({ bill, onBack, onPay }) => {
  return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-start py-10">
      <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Bill Details</h2>

        <div className="border p-4 rounded-lg">
          <p className="text-gray-700 font-semibold">{bill.hospitalName}</p>
          <p className="text-gray-600">Invoice: {bill.invoice}</p>
          <p className="text-gray-600">Date: {bill.date}</p>
          <p className="text-gray-600">
            Amount to Pay: S${bill.amount.toFixed(2)}
          </p>

          <a
            href="#"
            className="block mt-4 text-blue-600 underline"
            onClick={(e) => {
              e.preventDefault();
              alert("Download Bill functionality");
            }}
          >
            Download Bill
          </a>
        </div>

        {/* Back and Pay Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
          >
            Back
          </button>

          <button
            onClick={onPay}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
