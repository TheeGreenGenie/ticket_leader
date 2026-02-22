import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <ul className="menubar">
      <div>
        <li onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</li>
      </div>

      <div className="ticket">
        <li>Tickets</li>
        <ul className="dropdown ticket">
          <li onClick={() => navigate('/my-tickets')} style={{ cursor: 'pointer' }}>My Tickets</li>
          <li onClick={() => navigate('/live-queue')} style={{ cursor: 'pointer' }}>Purchase Tickets</li>
        </ul>
      </div>

      <div className="business">
        <li>Live Purchases</li>
        <ul className="dropdown live">
          <li onClick={() => navigate('/live-queue')} style={{ cursor: 'pointer' }}>Live Queues</li>
          <li>Queue Calendar</li>
        </ul>
      </div>

    </ul>
  );
}
