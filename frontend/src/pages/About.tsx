import React from 'react';

const About: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>About HappyPets</h1>
      
      <div className="glass-panel hover-lift" style={{ marginBottom: '3rem' }}>
        <h2>Our Mission</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.1rem' }}>
          At HappyPets, we believe that pets are family. Our mission is to provide the highest quality toys, 
          food, and accessories to keep your furry, feathery, and scaly friends healthy and happy. 
          We meticulously source our products from trusted brands to ensure safety and satisfaction.
        </p>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Meet the Team</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3].map((member) => (
          <div key={member} className="glass-panel hover-lift" style={{ flex: '1 1 250px', textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
              margin: '0 auto 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '2rem', fontWeight: 'bold'
            }}>
              T{member}
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Team Member {member}</h3>
            <p style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: '1rem' }}>Position</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Passionate about bringing the best pet products to your doorstep.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
