import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
//import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";

function App() {
  return (
    <>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/*<Route path="/about" element={<About />} />*/}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </Router>
    </>
  );
}

export default App;
