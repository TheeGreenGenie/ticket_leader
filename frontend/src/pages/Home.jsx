import { useNavigate } from 'react-router-dom';
import englandImg from '../assets/englandvs.jpg';
import btsImg from '../assets/bts.png';
import monsterImg from '../assets/monster.jpg';
import inaImg from '../assets/ina.png';
import vipImg from '../assets/vip.jpg';
import inag2Img from '../assets/inag2.webp';
import javaImg from '../assets/java.jpg';
import threeDayImg from '../assets/3day.jpg';
import EventCard from '../components/EventCard';

const TRENDING = [
  {
    title: 'England vs Croatia - World Cup - Match 22 (Group L)',
    date: 'Wed, Jun 17 · 3:00pm',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$1,063',
    badge: 'Selling Fast',
    thumb: englandImg,
  },
  {
    title: "BTS WORLD TOUR 'ARIRANG' IN ARLINGTON",
    date: 'Aug 16 · Sun · 8:00pm',
    venue: 'AT&T Stadium · Arlington, TX',
    price: 'Get Ready',
    badge: null,
    thumb: btsImg,
  },
  {
    title: 'Monster Energy AMA Supercross',
    date: 'Feb 21 · Sat · 5:30pm',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$46',
    badge: null,
    thumb: monsterImg,
  },
  {
    title: 'Inaugural Java House Grand Prix of Arlington – Friday',
    date: 'Mar 13 · Fri · 8:00am',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$27',
    badge: null,
    thumb: inaImg,
  },
];

const NEAR_YOU = [
  {
    title: 'VIP Concert Pit – Java House Grand Prix of Arlington – Friday',
    date: 'Mar 13 · Fri · 5:45pm',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$154',
    badge: null,
    thumb: vipImg,
  },
  {
    title: 'Inaugural Java House Grand Prix of Arlington – Saturday',
    date: 'Mar 14 · Sat · 8:00am',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$62',
    badge: null,
    thumb: inag2Img,
  },
  {
    title: 'Inaugural Java House Grand Prix of Arlington Weekend (3-Day Pass)',
    date: 'Mar 15 · Sun · TBD',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$138',
    badge: null,
    thumb: javaImg,
  },
  {
    title: '3 DAY PADDOCK PASS: Java House Grand Prix of Arlington',
    date: 'Mar 15 · Sun · 8:00am',
    venue: 'AT&T Stadium · Arlington, TX',
    price: '$103',
    badge: null,
    thumb: threeDayImg,
  },
];


function EventSection({ title, events }) {
  return (
    <section className="events-section">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <div className="events-row">
          {events.map((ev, i) => (
            <EventCard key={i} {...ev} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <img src={englandImg} alt="England vs Croatia" className="hero-img" />
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <span className="hero-badge">Featured Event</span>
              <h1 className="hero-title">England vs Croatia</h1>
              <p className="hero-meta" style={{ marginBottom: '6px' }}>
                World Cup · Match 22 (Group L)
              </p>
              <p className="hero-meta">
                Wed, Jun 17 · 3:00pm &nbsp;|&nbsp; AT&T Stadium · Arlington, TX
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/tickets/purchase/england-vs-croatia')}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  Find Tickets — From $1,063
                </button>
                <button
                  className="hero-link"
                  onClick={() => navigate('/tickets/purchase/england-vs-croatia')}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  View Event Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Sections */}
      <EventSection title="Trending" events={TRENDING} />
      <EventSection title="Near You" events={NEAR_YOU} />
    </>
  );
}
