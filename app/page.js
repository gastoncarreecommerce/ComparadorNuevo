'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    const res = await fetch(`/api/compare?ean=${ean}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const cardStyle = { background: 'white', padding: '20px', borderRadius: '8px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ textAlign: 'center' }}>Comparador EAN</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          placeholder="Ej: 7791290790978"
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
        />
        <button onClick={buscar} disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Buscando...' : 'Comparar'}
        </button>
      </div>

      {data && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
            {/* MELI */}
            <div style={{ ...cardStyle, borderTop: '5px solid #ffe600' }}>
                <h2>Mercado Libre</h2>
                {data.meli.found ? (
                    <div>
                        <img src={data.meli.thumbnail} style={{ height: '100px' }} />
                        <p><b>{data.meli.title}</b></p>
                        <p style={{ fontSize: '24px' }}>$ {data.meli.price}</p>
                        <a href={data.meli.permalink} target="_blank">Ver producto</a>
                    </div>
                ) : <p>No encontrado</p>}
            </div>

            {/* CARREFOUR */}
            <div style={{ ...cardStyle, borderTop: '5px solid #1e40af' }}>
                <h2>Carrefour</h2>
                {data.carrefour.found ? (
                    <div>
                        <p><b>{data.carrefour.title}</b></p>
                        <p style={{ fontSize: '24px' }}>$ {data.carrefour.price}</p>
                    </div>
                ) : <p>No encontrado en API VTEX</p>}
            </div>
        </div>
      )}
    </div>
  );
}
