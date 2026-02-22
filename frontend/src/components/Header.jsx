import { Link } from 'react-router-dom';
import ticketLogo from '../assets/ticket.PNG';

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img src={ticketLogo} alt="TicketLeader" className="brand-logo" />
            <span className="brand-name">TicketLeader</span>
          </Link>
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '7px 16px' }}>
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
