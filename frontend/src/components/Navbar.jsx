import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="menubar">
      <div className="container">
        <ul className="menubar-inner">

          <li className="nav-item">
            <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>
              Home
            </Link>
          </li>

          <li className="nav-item">
            <button className={`nav-link${location.pathname.startsWith('/tickets') ? ' active' : ''}`}>
              Tickets <span className="nav-chevron">▾</span>
            </button>
            <ul className="dropdown">
              <li className="dropdown-item">My Tickets</li>
              <li className="dropdown-item">
                <Link to="/tickets/purchase/england-vs-croatia" style={{ display: 'block' }}>
                  Purchase Tickets
                </Link>
              </li>
            </ul>
          </li>

          <li className="nav-item">
            <button className="nav-link">
              Live Purchases <span className="nav-chevron">▾</span>
            </button>
            <ul className="dropdown">
              <li className="dropdown-item">Live Queues</li>
              <li className="dropdown-item">Queue Calendar</li>
            </ul>
          </li>

          <li className="nav-item">
            <button className="nav-link">
              3D Walkthrough <span className="nav-chevron">▾</span>
            </button>
            <ul className="dropdown">
              <li className="dropdown-item">Stadium View</li>
              <li className="dropdown-item">Seat Walkthrough</li>
            </ul>
          </li>

        </ul>
      </div>
    </nav>
  );
}
