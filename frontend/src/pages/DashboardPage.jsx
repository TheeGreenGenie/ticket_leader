import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/styles.css';

export default function DashboardPage() {
  const navigate = useNavigate();

  // Redirect to login if no token (protected route)
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <>
      {/* Mirrors base.html */}
      <Header />
      <Navbar />
      <div className="body"></div>
      <Footer />
    </>
  );
}
