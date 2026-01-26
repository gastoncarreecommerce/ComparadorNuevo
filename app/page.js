'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    if (!ean) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/compare?ean=${ean}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- SUB-COMPONENTES DE UI ---

  const Badge = ({ children, color }) => (
    <span style={{ 
      backgroundColor: `${color}15`, 
      color: color, 
      padding: '4px 10px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '700',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      display: 'inline-block',
      border: `1px solid ${color}30`
    }}>
      {children}
    </span>
  );

  const ProductCard = ({ product, storeName, brandColor }) => {
    const [activeTab, setActiveTab] = useState('desc'); // 'desc' | 'specs'

    // Estado vacío o error
    if (!product || !product.found) {
        return (
            <div className="card empty-card">
                <div style={{ opacity: 0.5 }}>
                    <h3 style={{ color: '#888' }}>{storeName}</h3>
                    <p>Producto no catalogado</p>
                </div>
            </div>
        );
    }

    return (
      <div className="card" style={{ borderTop: `4px solid ${brandColor}` }}>
        {/* Header Tarjeta */}
        <div className="card-header">
            <Badge color={brandColor}>{storeName}</Badge>
            {product.price > 0 ? (
                <span className="stock-ok">● En Stock</span>
            ) : (
                <span className="stock-no">● Sin Stock</span>
            )}
        </div>

        {/* Imagen y Título */}
        <div className="product-hero">
            <div className="img-container">
                <img src={product.thumbnail} alt={product.title} />
            </div>
            <a href={product.link} target="_blank" className="product-title" title="Ver en la web">
                {product.title} <span style={{fontSize:'12px'}}>🔗</span>
            </a>
            <div className="product-price">
                $ {product.price?.toLocaleString('es-AR')}
            </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="tabs">
            <button 
                className={`tab-btn ${activeTab === 'desc' ? 'active' : ''}`} 
                onClick={() => setActiveTab('desc')}
            >
                Descripción
            </button>
            <button 
                className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`} 
                onClick={() => setActiveTab('specs')}
            >
                Ficha Técnica
            </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="tab-content custom-scroll">
            {activeTab === 'desc' && (
                <div 
                    className="html-desc"
                    dangerouslySetInnerHTML={{ __html: product.description || '<p>Sin descripción.</p>' }} 
                />
            )}

            {activeTab === 'specs' && (
                <ul className="specs-list">
                    {Object.entries(product.specs).length > 0 ? (
                        Object.entries(product.specs).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key}</strong>
                                <span>{value}</span>
                            </li>
                        ))
                    ) : (
                        <p style={{color: '#999', fontSize:'12px', textAlign:'center'}}>Sin datos técnicos.</p>
                    )}
                </ul>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* --- ESTILOS CSS EN LINEA PARA NEXT.JS --- */}
      <style jsx global>{`
        body { background-color: #f4f6f8; color: #1a202c; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; }
        * { box-sizing: border-box; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        /* HEADER */
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; color: #1a202c; letter-spacing: -1px; }
        .header p { color: #718096; font-size: 1.1rem; }

        /* BUSCADOR */
        .search-wrapper { 
            background: white; 
            padding: 10px; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            display: flex; 
            gap: 10px;
            max-width: 700px;
            margin: 0 auto 50px auto;
            border: 1px solid #e2e8f0;
        }
        .search-input { 
            flex: 1; 
            border: none; 
            padding: 15px 20px; 
            font-size: 18px; 
            outline: none; 
            color: #2d3748;
        }
        .search-btn {
            background: #000;
            color: white;
            border: none;
            padding: 0 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .search-btn:hover { background: #333; transform: translateY(-1px); }
        .search-btn:disabled { background: #ccc; transform: none; }

        /* GRID */
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
            gap: 30px; 
            align-items: start;
        }

        /* CARD DISEÑO PRO */
        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            transition: transform 0.2s, box-shadow 0.2s;
            height: 600px; /* Altura fija para alineación */
            display: flex;
            flex-direction: column;
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        
        .empty-card { 
            border: 2px dashed #e2e8f0; 
            background: #f7fafc; 
            justify-content: center; 
            align-items: center; 
            text-align: center; 
            box-shadow: none;
        }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        .stock-ok { color: #38a169; font-size: 11px; font-weight: 600; }
        .stock-no { color: #e53e3e; font-size: 11px; font-weight: 600; }

        .product-hero { text-align: center; margin-bottom: 20px; flex-shrink: 0; }
        .img-container { height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        .img-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
        
        .product-title { 
            display: block; 
            font-size: 15px; 
            line-height: 1.4; 
            color: #2d3748; 
            text-decoration: none; 
            font-weight: 500; 
            margin-bottom: 10px;
            height: 42px; 
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        .product-title:hover { color: #3182ce; }
        
        .product-price { font-size: 28px; font-weight: 800; color: #1a202c; letter-spacing: -0.5px; }

        /* TABS */
        .tabs { display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 15px; }
        .tab-btn {
            flex: 1;
            background: none;
            border: none;
            padding: 10px 0;
            font-size: 13px;
            font-weight: 600;
            color: #718096;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .tab-btn:hover { color: #4a5568; }
        .tab-btn.active { color: #1a202c; border-bottom-color: #1a202c; }

        /* CONTENIDO DE TABS */
        .tab-content { flex: 1; overflow-y: auto; padding-right: 5px; font-size: 13px; color: #4a5568; line-height: 1.6; }
        
        /* SCROLL PERSONALIZADO */
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a0aec0; }

        /* ESTILOS DE DESCRIPCION HTML */
        .html-desc p { margin-bottom: 10px; }
        .html-desc img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
        .html-desc ul { padding-left: 20px; }

        /* LISTA DE SPECS */
        .specs-list { list-style: none; padding: 0; margin: 0; }
        .specs-list li { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f7fafc; 
        }
        .specs-list li strong { color: #2d3748; font-weight: 600; margin-right: 10px; font-size: 12px; }
        .specs-list li span { text-align: right; word-break: break-word; font-size: 12px; }

      `}</style>

      {/* HEADER */}
      <div className="header">
        <h1>Monitor VTEX</h1>
        <p>Inteligencia de precios y catálogo en tiempo real</p>
      </div>
      
      {/* BUSCADOR */}
      <div className="search-wrapper">
        <input 
          className="search-input"
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Escanea o escribe un EAN..."
          autoFocus
        />
        <button className="search-btn" onClick={buscar} disabled={loading}>
          {loading ? 'Buscando...' : 'Analizar'}
        </button>
      </div>

      {/* RESULTADOS */}
      {data && (
          <div className="grid">
            <ProductCard 
                product={data.carrefour} 
                storeName="Carrefour" 
                brandColor="#1e429f" // Azul Carrefour
            />
            <ProductCard 
                product={data.fravega} 
                storeName="Frávega" 
                brandColor="#7526d9" // Violeta Frávega
            />
            <ProductCard 
                product={data.oncity} 
                storeName="OnCity" 
                brandColor="#ff4d00" // Naranja OnCity
            />
          </div>
      )}
    </div>
  );
}
