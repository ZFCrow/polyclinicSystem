import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Appointments from './pages/Appointments';
import Bill from './pages/Bill';
import DoctorDashbaord from './pages/DoctorDashbaord';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';



function App() {
  return (
    <Router>
      <div className="App">
        {/* <Navbar /> */}
        <div className="content">
          <Routes>
            <Route extact path="/" element={<Login />} />
            <Route extact path="/home" element={<Home />} />
            <Route extact path="/login" element={<Login />} />
            <Route extact path="/registration" element={<Registration />} />
            <Route extact path="/appointments" element={<Appointments />} />
            <Route extact path="/bill" element={<Bill />} />
            <Route extact path="/doctordashbaord" element={<DoctorDashbaord />} />
            <Route extact path="/userdashboard" element={<UserDashboard />} />
            <Route extact path="/admindashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;