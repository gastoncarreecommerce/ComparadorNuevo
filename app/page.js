'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/compare?ean=${ean}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const VtexCard = ({ product, storeName, color }) => {
    if (!product || !product.found) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ color: color, marginTop: 0 }}>{storeName}</h3>
                <p style={{ color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Sin datos.</p>
            </div>
        );
    }

    return (
      <div style={{ border: `1px solid ${color}`, borderRadius: '12px', padding: '15px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
            <img src={product.thumbnail} style={{ width: '60px', height: '60px', objectFit: 'contain', marginRight: '10px' }} />
            <div style={{ overflow: 'hidden' }}>
                <h2 style={{ color: color, margin: '0 0 2px 0', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{storeName}</h2>
                <a href={product.link} target="_blank" style={{ fontSize: '11px', color: '#555', textDecoration: 'none' }}>Ver en web ↗</a>
            </div>
        </div>

        {/* Precio */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>$ {product.price?.toLocaleString('es-AR')}</span>
        </div>

        {/* Descripción (Scroll) */}
        <div style={{ marginBottom: '10px', flex: 1 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>Descripción</p>
            <div 
                dangerouslySetInnerHTML={{ __html: product.description }} 
                style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', color: '#666', lineHeight: '1.3', border: '1px solid #f0f0f0', padding: '8px', borderRadius: '6px', backgroundColor: '#fafafa' }}
            />
        </div>

        {/* Specs (Scroll) */}
        <div style={{ flex: 1, minHeight: '150px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>Ficha Técnica</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '0 8px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.entries(product.specs).map(([key, value]) => (
                        <li key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '11px' }}>
                            <span style={{ fontWeight: '600', color: '#444', marginRight: '5px' }}>{key}</span>
                            <span style={{ color: '#666', textAlign: 'right', wordBreak: 'break-word', maxWidth: '60%' }}>{value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Monitor de Catálogo VTEX</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <input 
          style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="EAN (Ej: 8806090972740)"
        />
        <button onClick={buscar} disabled={loading} style={{ padding: '0 30px', backgroundColor: '#000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? '...' : 'Buscar'}
        </button>
      </div>

      {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <VtexCard product={data.carrefour} storeName="Carrefour" color="#1e429f" />
            <VtexCard product={data.fravega} storeName="Frávega" color="#7526d9" />
            <VtexCard product={data.oncity} storeName="OnCity" color="#ff4d00" />
          </div>
      )}
    </div>
  );
}
