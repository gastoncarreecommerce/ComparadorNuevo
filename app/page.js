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

    // 1. MERCADO LIBRE
    fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          // Filtramos atributos importantes de MeLi (Marca, Modelo, etc)
          const attributes = item.attributes?.filter(a => a.id === 'BRAND' || a.id === 'MODEL' || a.id === 'PACKAGE_TYPE' || a.id === 'VOLUME') || [];
          
          setMeliData({ 
            found: true, 
            title: item.title, 
            thumbnail: item.thumbnail, 
            permalink: item.permalink,
            specs: attributes // Guardamos los atributos
          });
        } else {
          setMeliData({ found: false });
        }
      })
      .catch(() => setMeliData({ found: false }));

    // 2. CARREFOUR
    fetch(`/api/compare?ean=${ean}`)
      .then(res => res.json())
      .then(data => setCarrefourData(data))
      .catch(() => setCarrefourData({ found: false }));

    setLoading(false);
  };

  // Componente auxiliar para renderizar la tabla de specs
  const SpecsTable = ({ data, source }) => {
    if (!data.found) return <p style={{ color: '#666', fontStyle: 'italic' }}>No encontrado</p>;

    return (
      <div style={{ fontSize: '14px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <img src={data.thumbnail} style={{ width: '60px', height: '60px', objectFit: 'contain', marginRight: '10px' }} />
            <h3 style={{ fontSize: '14px', margin: 0, lineHeight: '1.2' }}>{data.title}</h3>
        </div>

        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', color: '#888' }}>Ficha Técnica</h4>
            
            {/* Renderizado para Carrefour (Objeto Clave-Valor) */}
            {source === 'carrefour' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.entries(data.specs).slice(0, 8).map(([key, value]) => (
                        <li key={key} style={{ borderBottom: '1px solid #ddd', padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 'bold', color: '#555' }}>{key}:</span>
                            <span>{value}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Renderizado para Mercado Libre (Array de Objetos) */}
            {source === 'meli' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.specs.map((attr) => (
                        <li key={attr.id} style={{ borderBottom: '1px solid #ddd', padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 'bold', color: '#555' }}>{attr.name}:</span>
                            <span>{attr.value_name}</span>
                        </li>
                    ))}
                </ul>
            )}
            
            {(!data.specs || (Array.isArray(data.specs) && data.specs.length === 0) || (typeof data.specs === 'object' && Object.keys(data.specs).length === 0)) && 
                <p>Sin especificaciones detalladas.</p>
            }
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Comparador de Fichas Técnicas</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="EAN ej: 7790895007217"
        />
        <button onClick={buscar} disabled={loading} style={{ padding: '0 25px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {loading ? '...' : 'Analizar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Columna Mercado Libre */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#dba900', marginTop: 0, fontSize: '18px' }}>Mercado Libre</h2>
          {meliData ? <SpecsTable data={meliData} source="meli" /> : <p style={{color:'#ccc'}}>Esperando...</p>}
        </div>

        {/* Columna Carrefour */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e429f', marginTop: 0, fontSize: '18px' }}>Carrefour</h2>
          {carrefourData ? <SpecsTable data={carrefourData} source="carrefour" /> : <p style={{color:'#ccc'}}>Esperando...</p>}
        </div>
      </div>
    </div>
  );
}
