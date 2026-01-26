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

    // --- 1. MERCADO LIBRE (Lógica Mejorada) ---
    // Hacemos todo el proceso dentro de una función async para poder encadenar llamadas
    const fetchMeli = async () => {
      try {
        // A. Buscamos el producto
        const resSearch = await fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`);
        const dataSearch = await resSearch.json();

        if (dataSearch.results && dataSearch.results.length > 0) {
          const item = dataSearch.results[0];
          
          // B. ¡TRUCO! Con el ID del item, buscamos su descripción (Texto SEO)
          const resDesc = await fetch(`https://api.mercadolibre.com/items/${item.id}/description`);
          const dataDesc = await resDesc.json();
          
          // Filtramos atributos técnicos (Specs)
          const attributes = item.attributes?.filter(a => 
            a.id === 'BRAND' || a.id === 'MODEL' || a.id === 'PACKAGE_TYPE' || a.id === 'VOLUME' || a.id === 'LINE'
          ) || [];

          setMeliData({ 
            found: true, 
            title: item.title, 
            price: item.price,
            thumbnail: item.thumbnail, 
            permalink: item.permalink,
            specs: attributes,
            // MeLi usa 'plain_text' para la descripción
            description: dataDesc.plain_text || "Sin descripción detallada."
          });
        } else {
          setMeliData({ found: false });
        }
      } catch (e) {
        console.error(e);
        setMeliData({ found: false });
      }
    };
    
    // Ejecutamos la búsqueda de MeLi
    fetchMeli();

    // --- 2. CARREFOUR (Sin cambios, ya funciona perfecto) ---
    fetch(`/api/compare?ean=${ean}`)
      .then(res => res.json())
      .then(data => setCarrefourData(data))
      .catch(() => setCarrefourData({ found: false }));

    setLoading(false);
  };

  // Componente de Tarjeta de Producto
  const ProductCard = ({ data, source }) => {
    if (!data.found) return <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No encontrado con este EAN.</p>;

    return (
      <div style={{ fontSize: '14px', textAlign: 'left' }}>
        {/* Cabecera: Foto, Título y Precio */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
            <img src={data.thumbnail} style={{ width: '70px', height: '70px', objectFit: 'contain', marginRight: '15px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 5px 0', lineHeight: '1.3', minHeight: '36px' }}>{data.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#333', fontSize: '18px' }}>$ {data.price?.toLocaleString('es-AR')}</span>
                {data.permalink && <a href={data.permalink} target="_blank" style={{ fontSize: '11px', color: '#0070f3' }}>Ver web ↗</a>}
                {data.link && <a href={data.link} target="_blank" style={{ fontSize: '11px', color: '#0070f3' }}>Ver web ↗</a>}
              </div>
            </div>
        </div>

        {/* Descripción (SEO) */}
        <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Descripción</h4>
            <div style={{ 
                fontSize: '13px', 
                color: '#555', 
                lineHeight: '1.5', 
                maxHeight: '150px', 
                overflowY: 'auto', 
                border: '1px solid #f0f0f0', 
                padding: '10px', 
                borderRadius: '4px',
                backgroundColor: '#fafafa',
                whiteSpace: source === 'meli' ? 'pre-wrap' : 'normal' // MeLi necesita respetar saltos de línea
            }}>
                {source === 'carrefour' ? (
                   <div dangerouslySetInnerHTML={{ __html: data.description }} />
                ) : (
                   data.description
                )}
            </div>
        </div>

        {/* Ficha Técnica */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', letterSpacing: '1px' }}>Especificaciones</h4>
            
            {source === 'carrefour' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.entries(data.specs).slice(0, 6).map(([key, value]) => (
                        <li key={key} style={{ borderBottom: '1px solid #f5f5f5', padding: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#444' }}>{key}</span>
                            <span style={{ color: '#666', textAlign: 'right' }}>{value}</span>
                        </li>
                    ))}
                </ul>
            )}

            {source === 'meli' && data.specs && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.specs.map((attr) => (
                        <li key={attr.id} style={{ borderBottom: '1px solid #f5f5f5', padding: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#444' }}>{attr.name}</span>
                            <span style={{ color: '#666', textAlign: 'right' }}>{attr.value_name}</span>
                        </li>
                    ))}
                </ul>
            )}
            
            {/* Mensaje si no hay specs */}
            {(!data.specs || (Array.isArray(data.specs) && data.specs.length === 0)) && 
                <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Sin ficha técnica disponible.</p>
            }
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#222', marginBottom: '10px' }}>Comparador EAN</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '14px' }}>Analiza Título, Precio, Descripción y Specs</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
        <input 
          style={{ flex: 1, padding: '12px 15px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px', outline: 'none' }}
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="EAN del producto (Ej: 7790895007217)"
        />
        <button onClick={buscar} disabled={loading} style={{ padding: '0 25px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
          {loading ? '...' : 'Buscar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Columna Mercado Libre */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}>
          <h2 style={{ color: '#dba900', marginTop: 0, fontSize: '20px', paddingBottom: '10px', borderBottom: '2px solid #dba900', display: 'inline-block' }}>Mercado Libre</h2>
          {meliData ? <ProductCard data={meliData} source="meli" /> : <p style={{color:'#ccc', marginTop: '20px'}}>Esperando búsqueda...</p>}
        </div>

        {/* Columna Carrefour */}
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}>
          <h2 style={{ color: '#1e429f', marginTop: 0, fontSize: '20px', paddingBottom: '10px', borderBottom: '2px solid #1e429f', display: 'inline-block' }}>Carrefour</h2>
          {carrefourData ? <ProductCard data={carrefourData} source="carrefour" /> : <p style={{color:'#ccc', marginTop: '20px'}}>Esperando búsqueda...</p>}
        </div>
      </div>
    </div>
  );
}
