export default function EventCard({ title, date, venue, price, badge, thumb }) {
  return (
    <div className="event-card">
      <img src={thumb} alt={title} className="event-card-thumb" />
      <div className="event-card-body">
        {badge && (
          <div className="event-card-badges">
            <span className={`badge ${badge === 'Selling Fast' ? 'badge-red' : 'badge-green'}`}>
              {badge}
            </span>
          </div>
        )}
        <p className="event-card-title">{title}</p>
        <p className="event-card-date">{date}</p>
        <p className="event-card-venue">{venue}</p>
        <div className="event-card-footer">
          <span className="event-card-price">from {price}</span>
          <span className="event-card-cta">Get Tickets →</span>
        </div>
      </div>
    </div>
  );
}
