import React from 'react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <aside className="floating-sidebar">
        <h1>Portal</h1>
        <nav className="nav-menu">
          <button className="btn">Dashboard</button>
          <button className="btn">Settings</button>
        </nav>
      </aside>
      <main className="main-content">
        <section className="card featured-card">
          <h2>Overview</h2>
          <p>Welcome to the custom interface. This layout uses an asymmetrical structure.</p>
          <input className="input-field" type="text" placeholder="Search resources..." />
        </section>
        <section className="card">
          <h3>Statistics</h3>
          <p>Activity is monitored.</p>
        </section>
        <section className="card">
          <h3>Actions</h3>
          <button className="btn">Deploy</button>
        </section>
      </main>
    </div>
  );
};
