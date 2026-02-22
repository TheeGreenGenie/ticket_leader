import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="dashboard-body">
      <div className="container">
        <p className="dashboard-welcome">Welcome back</p>
        <p className="dashboard-sub">Your tickets and upcoming events will appear here.</p>
      </div>
    </div>
  );
}
