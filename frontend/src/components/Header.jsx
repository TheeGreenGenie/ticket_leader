import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="header-logo">
          <span className="logo-icon">TL</span>
          <span className="logo-text">TicketLeader</span>
        </Link>

        <nav className="header-nav">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">Events</Link>
              <Link to="/my-tickets" className="nav-link">My Tickets</Link>
              <div className="nav-divider" />
              <div className="user-menu">
                <span className="user-greeting">Hey, {username || 'User'}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/" className="btn-signin">Sign In</Link>
            </>
          )}
        </nav>

        <button className="mobile-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
