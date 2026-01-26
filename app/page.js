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
    } catch (e) {
      console.error(e);
    }
    
    setLoading(false);
  };

  // Componente Reutilizable para Tarjeta VTEX
  const VtexCard = ({ product, storeName, color }) => {
    if (!product || !product.found) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ color: color, marginTop: 0 }}>{storeName}</h3>
                <p style={{ color: '#888', fontStyle: 'italic' }}>Producto no encontrado o sin stock.</p>
            </div>
        );
    }

    return (
      <div style={{ border: `1px solid ${color}`, borderRadius: '12px', padding: '20px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <img src={product.thumbnail} style={{ width: '80px', height: '80px', objectFit: 'contain', marginRight: '15px' }} />
            <div>
                <h2 style={{ color: color, margin: '0 0 5px 0', fontSize: '18px' }}>{storeName}</h2>
                <a href={product.link} target="_blank" style={{ fontSize: '13px', color: '#555', textDecoration: 'none', fontWeight: '500' }}>
                    {product.title} ↗
                </a>
            </div>
        </div>

        {/* Precio */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                $ {product.price.toLocaleString('es-AR')}
            </span>
        </div>

        {/* Descripción (Con Scroll) */}
        <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>Descripción</p>
            <div 
                dangerouslySetInnerHTML={{ __html: product.description }} 
                style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    fontSize: '13px', 
                    color: '#666', 
                    lineHeight: '1.4',
                    border: '1px solid #eee',
                    padding: '10px',
                    borderRadius: '6px'
                }}
            />
        </div>

        {/* Specs (Tabla) */}
        <div>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>Ficha Técnica</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(product.specs).slice(0, 5).map(([key, value]) => (
                    <li key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#444' }}>{key}</span>
                        <span style={{ color: '#666' }}>{value}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Comparador VTEX</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Comparando por EAN en Carrefour y Frávega</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
        <input 
          style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="EAN ej: 7790895007217 (Coca Cola) o 8806090972740 (TV Samsung)"
        />
        <button onClick={buscar} disabled={loading} style={{ padding: '0 30px', backgroundColor: '#7526d9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {loading ? '...' : 'Comparar'}
        </button>
      </div>

      {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <VtexCard product={data.carrefour} storeName="Carrefour" color="#1e429f" />
            <VtexCard product={data.fravega} storeName="Frávega" color="#7526d9" />
          </div>
      )}
    </div>
  );
}
