import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 
import Home from './pages/Home';
import About from './pages/About';
import Suites from './pages/Suites';
import Experience from './pages/Experience';
import BookNow from './pages/BookNow';
import Admin from './pages/Admin';
import ScrollToTop from './components/ScrollToTop'; 

function App() {
  return (
    <Router>
      <ScrollToTop /> 
      
      <div className="flex flex-col min-h-screen bg-white font-sans">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* PUBLIC GUEST ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/about-hotel" element={<About />} />
            <Route path="/suites" element={<Suites />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/book-now" element={<BookNow />} />
            
            {/* ADMIN PORTAL */}
            <Route path="/kedest-admin-portal-2026" element={<Admin />} />

            {/* CATCH-ALL */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;