'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [meliData, setMeliData] = useState(null);
  const [carrefourData, setCarrefourData] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    setMeliData(null);
    setCarrefourData(null);

    // 1. MERCADO LIBRE (Desde el navegador para evitar bloqueo 403)
    // Usamos fetch directo a la API pública
    fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          setMeliData({ 
            found: true, 
            title: item.title, 
            price: item.price, 
            thumbnail: item.thumbnail, 
            permalink: item.permalink 
          });
        } else {
          setMeliData({ found: false });
        }
      })
      .catch(() => setMeliData({ found: false, error: true }));

    // 2. CARREFOUR (Desde nuestro Backend Seguro)
    fetch(`/api/compare?ean=${ean}`)
      .then(res => res.json())
      .then(data => setCarrefourData(data))
      .catch(() => setCarrefourData({ found: false }));

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Comparador EAN</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
        <input 
          style={{ flex: 1, padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ccc' }}
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Ej: 7790895000997"
        />
        <button onClick={buscar} style={{ padding: '0 30px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
          {loading ? '...' : 'Comparar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Tarjeta Mercado Libre */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#dba900', marginTop: 0 }}>Mercado Libre</h2>
          {meliData ? (
            meliData.found ? (
              <>
                <img src={meliData.thumbnail} style={{ height: '100px', objectFit: 'contain' }} />
                <h3 style={{ fontSize: '16px' }}>{meliData.title}</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>$ {meliData.price.toLocaleString('es-AR')}</p>
                <a href={meliData.permalink} target="_blank" style={{ color: '#0070f3', textDecoration: 'none' }}>Ver en MeLi →</a>
              </>
            ) : <p style={{ color: '#666' }}>No encontrado o sin stock.</p>
          ) : <p style={{ color: '#ccc' }}>Esperando...</p>}
        </div>

        {/* Tarjeta Carrefour */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e429f', marginTop: 0 }}>Carrefour</h2>
          {carrefourData ? (
            carrefourData.found ? (
              <>
                <img src={carrefourData.thumbnail} style={{ height: '100px', objectFit: 'contain' }} />
                <h3 style={{ fontSize: '16px' }}>{carrefourData.title}</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>$ {carrefourData.price.toLocaleString('es-AR')}</p>
              </>
            ) : <p style={{ color: '#666' }}>No encontrado en API VTEX.</p>
          ) : <p style={{ color: '#ccc' }}>Esperando...</p>}
        </div>
      </div>
    </div>
  );
}
