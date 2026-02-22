import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, createOrder } from '../api/events';

export default function PurchaseTickets() {
  const { slug } = useParams();

  const [event, setEvent]               = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [fetchError, setFetchError]     = useState('');

  const [selectedSection, setSelectedSection] = useState(null);
  const [quantity, setQuantity]               = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [order, setOrder]             = useState(null);

  useEffect(() => {
    setLoadingEvent(true);
    getEvent(slug)
      .then((data) => {
        setEvent(data);
      })
      .catch(() => setFetchError('Could not load event. Please try again.'))
      .finally(() => setLoadingEvent(false));
  }, [slug]);

  async function handleProceed() {
    if (!selectedSection) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const result = await createOrder({
        eventSlug:      event.slug,
        eventTitle:     event.title,
        sectionId:      selectedSection._id,
        sectionName:    selectedSection.name,
        quantity,
        pricePerTicket: selectedSection.price,
      });
      setOrder(result);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────
  if (loadingEvent) {
    return (
      <div className="pt-page">
        <div className="container">
          <p className="pt-loading">Loading event…</p>
        </div>
      </div>
    );
  }

  // ── Fetch error ────────────────────────────────────────────
  if (fetchError || !event) {
    return (
      <div className="pt-page">
        <div className="container">
          <p className="pt-error">{fetchError || 'Event not found.'}</p>
        </div>
      </div>
    );
  }

  // ── Confirmation screen ────────────────────────────────────
  if (order) {
    const orderId = order._id.slice(-8).toUpperCase();
    return (
      <div className="pt-page">
        <div className="container">
          <div className="pt-confirm">
            <div className="pt-confirm-icon">✓</div>
            <h2 className="pt-confirm-title">Reservation Confirmed</h2>
            <p className="pt-confirm-sub">Order #{orderId}</p>

            <div className="pt-confirm-summary">
              <div className="pt-confirm-row">
                <span>Event</span>
                <span>{order.eventTitle}</span>
              </div>
              <div className="pt-confirm-row">
                <span>Section</span>
                <span>{order.sectionName}</span>
              </div>
              <div className="pt-confirm-row">
                <span>Tickets</span>
                <span>
                  {order.quantity} × ${order.pricePerTicket.toLocaleString()}
                </span>
              </div>
              <div className="pt-confirm-row pt-confirm-total">
                <span>Total</span>
                <span>${order.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-confirm-next">
              <p className="pt-confirm-next-label">Next step</p>
              <p className="pt-confirm-next-value">Queue screen (to be added)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main purchase UI ───────────────────────────────────────
  const total = selectedSection ? selectedSection.price * quantity : 0;

  return (
    <div className="pt-page">
      <div className="container">

        {/* Event header */}
        <div className="pt-header">
          <p className="pt-header-badge">{event.subtitle}</p>
          <h1 className="pt-header-title">{event.title}</h1>
          <p className="pt-header-meta">
            {event.date} · {event.time}&nbsp;&nbsp;|&nbsp;&nbsp;{event.venue}, {event.city}
          </p>
        </div>

        <div className="pt-body">

          {/* Left — section + quantity */}
          <div className="pt-left">
            <h2 className="pt-section-heading">Select a Section</h2>
            <div className="pt-sections">
              {event.sections.map((sec) => (
                <button
                  key={sec._id}
                  className={`pt-section-card${selectedSection?._id === sec._id ? ' selected' : ''}`}
                  onClick={() => { setSelectedSection(sec); setSubmitError(''); }}
                >
                  <div className="pt-section-card-left">
                    <p className="pt-section-name">{sec.name}</p>
                    <p className="pt-section-desc">{sec.description}</p>
                    <p className="pt-section-avail">{sec.available} tickets available</p>
                  </div>
                  <div className="pt-section-card-right">
                    <p className="pt-section-price">${sec.price.toLocaleString()}</p>
                    <p className="pt-section-per">per ticket</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedSection && (
              <div className="pt-qty">
                <span className="pt-qty-label">Quantity</span>
                <div className="pt-qty-controls">
                  <button
                    className="pt-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="pt-qty-value">{quantity}</span>
                  <button
                    className="pt-qty-btn"
                    onClick={() => setQuantity((q) => Math.min(6, q + 1))}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>max 6</span>
              </div>
            )}
          </div>

          {/* Right — order summary */}
          <div className="pt-right">
            <div className="pt-summary">
              <p className="pt-summary-title">Order Summary</p>

              {!selectedSection ? (
                <p className="pt-summary-empty">
                  Select a section to<br />see your order summary.
                </p>
              ) : (
                <>
                  <div className="pt-summary-rows">
                    <div className="pt-summary-row">
                      <span>{selectedSection.name}</span>
                      <span>
                        ${selectedSection.price.toLocaleString()} × {quantity}
                      </span>
                    </div>
                    <div className="pt-summary-row pt-summary-fees">
                      <span>Service fees</span>
                      <span>Included</span>
                    </div>
                  </div>

                  <div className="pt-summary-total">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>

                  {submitError && (
                    <p className="auth-error" style={{ marginBottom: '14px' }}>
                      {submitError}
                    </p>
                  )}

                  <button
                    className="btn btn-primary pt-proceed-btn"
                    onClick={handleProceed}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing…' : 'Proceed'}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
