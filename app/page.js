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
          // Obtenemos atributos de MeLi
          const attributes = item.attributes?.filter(a => a.id === 'BRAND' || a.id === 'MODEL' || a.id === 'PACKAGE_TYPE' || a.id === 'VOLUME') || [];
          
          setMeliData({ 
            found: true, 
            title: item.title, 
            thumbnail: item.thumbnail, 
            permalink: item.permalink,
            specs: attributes,
            // MeLi no suele dar la descripción completa en la búsqueda, requiere otra llamada a /items/{id}/description
            // Por ahora dejamos placeholder o título
            description: item.title 
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

  // Componente de Tabla + Descripción
  const ProductCard = ({ data, source }) => {
    if (!data.found) return <p style={{ color: '#666', fontStyle: 'italic' }}>No encontrado</p>;

    return (
      <div style={{ fontSize: '14px', textAlign: 'left' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
            <img src={data.thumbnail} style={{ width: '60px', height: '60px', objectFit: 'contain', marginRight: '10px' }} />
            <div>
              <h3 style={{ fontSize: '14px', margin: '0 0 5px 0', lineHeight: '1.2' }}>{data.title}</h3>
              {data.price && <span style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>$ {data.price.toLocaleString('es-AR')}</span>}
            </div>
        </div>

        {/* Descripción (SEO) */}
        {data.description && (
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Descripción</h4>
                <div 
                    // IMPORTANTE: Esto renderiza el HTML que viene de VTEX
                    dangerouslySetInnerHTML={{ __html: data.description }} 
                    style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '8px', borderRadius: '4px' }} 
                />
            </div>
        )}

        {/* Ficha Técnica */}
        <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Especificaciones</h4>
            
            {/* Specs Carrefour */}
            {source === 'carrefour' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.entries(data.specs).slice(0, 6).map(([key, value]) => (
                        <li key={key} style={{ borderBottom: '1px solid #e0e0e0', padding: '4px 0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#444' }}>{key}:</span>
                            <span style={{ color: '#666' }}>{value}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Specs Mercado Libre */}
            {source === 'meli' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.specs.map((attr) => (
                        <li key={attr.id} style={{ borderBottom: '1px solid #e0e0e0', padding: '4px 0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#444' }}>{attr.name}:</span>
                            <span style={{ color: '#666' }}>{attr.value_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Comparador SEO & Ficha</h1>
      
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
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', background: '#fff' }}>
          <h2 style={{ color: '#dba900', marginTop: 0, fontSize: '18px', borderBottom: '2px solid #dba900', display: 'inline-block', paddingBottom: '5px' }}>Mercado Libre</h2>
          {meliData ? <ProductCard data={meliData} source="meli" /> : <p style={{color:'#ccc'}}>Esperando...</p>}
        </div>

        {/* Columna Carrefour */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', background: '#fff' }}>
          <h2 style={{ color: '#1e429f', marginTop: 0, fontSize: '18px', borderBottom: '2px solid #1e429f', display: 'inline-block', paddingBottom: '5px' }}>Carrefour</h2>
          {carrefourData ? <ProductCard data={carrefourData} source="carrefour" /> : <p style={{color:'#ccc'}}>Esperando...</p>}
        </div>
      </div>
    </div>
  );
}
