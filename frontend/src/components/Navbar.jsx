export default function Navbar() {
  return (
    <ul className="menubar">
      <div>
        <li>Home</li>
      </div>

      <div className="ticket">
        <li>Tickets</li>
        <ul className="dropdown ticket">
          <li>My Tickets</li>
          <li>Purchase Tickets</li>
        </ul>
      </div>

      <div className="business">
        <li>Live Purchases</li>
        <ul className="dropdown live">
          <li>Live Queues</li>
          <li>Queue Calendar</li>
        </ul>
      </div>

      <div className="walkthrough">
        <li>3D Walkthrough</li>
        <ul className="dropdown walkthrough">
          <li>Stadium View</li>
          <li>Seat Walkthrough</li>
        </ul>
      </div>
    </ul>
  );
}
