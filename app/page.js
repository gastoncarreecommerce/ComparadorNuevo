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

  // --- COMPONENTE: BADGE (Etiqueta de Tienda) ---
  const Badge = ({ children, color }) => (
    <span style={{ 
      backgroundColor: `${color}15`, // Fondo transparente al 15%
      color: color, 
      padding: '4px 10px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: '800',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      display: 'inline-block',
      border: `1px solid ${color}40`
    }}>
      {children}
    </span>
  );

  // --- COMPONENTE: TARJETA DE PRODUCTO ---
  const ProductCard = ({ product, storeName, brandColor }) => {
    const [activeTab, setActiveTab] = useState('desc'); // 'desc' (Descripción) | 'specs' (Ficha)

    // ESTADO: VACÍO O NO ENCONTRADO
    if (!product || !product.found) {
        return (
            <div className="card empty-card">
                <div style={{ opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ color: '#aaa', margin: '0 0 10px 0' }}>{storeName}</h3>
                    <span style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Producto no catalogado</p>
                </div>
            </div>
        );
    }

    // ESTADO: CON DATOS
    return (
      <div className="card" style={{ borderTop: `5px solid ${brandColor}` }}>
        
        {/* 1. Header: Marca y Stock */}
        <div className="card-header">
            <Badge color={brandColor}>{storeName}</Badge>
            {product.price > 0 ? (
                <span className="stock-ok">● Disponible</span>
            ) : (
                <span className="stock-no">● Sin Precio</span>
            )}
        </div>

        {/* 2. Hero: Imagen, Título y Precio */}
        <div className="product-hero">
            <div className="img-container">
                <img src={product.thumbnail} alt={product.title} />
            </div>
            
            <a href={product.link} target="_blank" className="product-title" title="Ver en la web oficial">
                {product.title} <span style={{fontSize:'12px', marginLeft:'4px'}}>🔗</span>
            </a>
            
            <div className="product-price">
                $ {product.price?.toLocaleString('es-AR')}
            </div>
        </div>

        {/* 3. Navegación (Pestañas) */}
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

        {/* 4. Contenido Dinámico (Scrollable) */}
        <div className="tab-content custom-scroll">
            
            {/* VISTA: DESCRIPCIÓN (HTML/SEO) */}
            {activeTab === 'desc' && (
                <div className="html-desc">
                    {product.description ? (
                        <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                        <p style={{color:'#999', fontStyle:'italic', textAlign:'center', marginTop:'20px'}}>
                            El retailer no provee descripción comercial.
                        </p>
                    )}
                </div>
            )}

            {/* VISTA: FICHA TÉCNICA (Tabla) */}
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
                        <p style={{color:'#999', fontStyle:'italic', textAlign:'center', marginTop:'20px'}}>
                            Sin especificaciones técnicas estructuradas.
                        </p>
                    )}
                </ul>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        body { background-color: #f0f2f5; color: #1a202c; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; }
        * { box-sizing: border-box; }
        
        .container { max-width: 1300px; margin: 0 auto; padding: 40px 20px; }
        
        /* HEADER */
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 2.2rem; margin-bottom: 8px; color: #1a202c; letter-spacing: -0.5px; }
        .header p { color: #64748b; font-size: 1rem; }

        /* BUSCADOR */
        .search-wrapper { 
            background: white; 
            padding: 8px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
            display: flex; 
            gap: 10px;
            max-width: 600px;
            margin: 0 auto 50px auto;
            border: 1px solid #e2e8f0;
        }
        .search-input { 
            flex: 1; 
            border: none; 
            padding: 12px 20px; 
            font-size: 16px; 
            outline: none; 
            color: #2d3748;
            background: transparent;
        }
        .search-btn {
            background: #0f172a;
            color: white;
            border: none;
            padding: 0 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .search-btn:hover { background: #334155; }
        .search-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

        /* GRID RESPONSIVO */
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
            gap: 25px; 
            align-items: start;
        }

        /* TARJETAS */
        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: transform 0.2s, box-shadow 0.2s;
            height: 650px; /* Altura fija para alinear el grid */
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        
        .empty-card { 
            border: 2px dashed #cbd5e1; 
            background: #f8fafc; 
            box-shadow: none;
            justify-content: center;
        }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .stock-ok { color: #10b981; fontSize: 11px; font-weight: 700; text-transform: uppercase; }
        .stock-no { color: #ef4444; fontSize: 11px; font-weight: 700; text-transform: uppercase; }

        .product-hero { text-align: center; margin-bottom: 20px; flex-shrink: 0; }
        .img-container { height: 140px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        .img-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
        
        .product-title { 
            display: block; 
            font-size: 15px; 
            line-height: 1.4; 
            color: #1e293b; 
            text-decoration: none; 
            font-weight: 600; 
            margin-bottom: 12px;
            height: 42px; /* Limita a 2 líneas */
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        .product-title:hover { color: #3b82f6; }
        
        .product-price { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }

        /* TABS */
        .tabs { display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 0; }
        .tab-btn {
            flex: 1;
            background: none;
            border: none;
            padding: 12px 0;
            font-size: 13px;
            font-weight: 600;
            color: #94a3b8;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .tab-btn:hover { color: #64748b; }
        .tab-btn.active { color: #0f172a; border-bottom-color: #0f172a; }

        /* CONTENIDO INTERNO */
        .tab-content { 
            flex: 1; 
            overflow-y: auto; 
            padding: 15px 5px 0 0; 
            font-size: 13px; 
            color: #475569; 
            line-height: 1.6; 
        }
        
        /* SCROLL PERSONALIZADO */
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* ESTILOS HTML DESCRIPCION */
        .html-desc p { margin-bottom: 10px; }
        .html-desc img { max-width: 100% !important; height: auto !important; border-radius: 6px; margin: 10px 0; display: block; }
        .html-desc ul, .html-desc ol { padding-left: 20px; margin-bottom: 10px; }
        .html-desc li { margin-bottom: 5px; }

        /* TABLA DE SPECS */
        .specs-list { list-style: none; padding: 0; margin: 0; }
        .specs-list li { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f1f5f9; 
        }
        .specs-list li:last-child { border-bottom: none; }
        .specs-list li strong { color: #334155; font-weight: 600; margin-right: 15px; font-size: 12px; width: 40%; }
        .specs-list li span { text-align: right; word-break: break-word; font-size: 12px; width: 60%; color: #64748b; }

      `}</style>

      {/* HEADER */}
      <div className="header">
        <h1>V-Intel <span style={{fontSize:'0.4em', verticalAlign:'super', color:'#2563eb', fontWeight:'bold', border:'1px solid #2563eb', padding:'2px 6px', borderRadius:'4px'}}>BETA</span></h1>
        <p>Monitor de Inteligencia de Catálogo Multi-Tienda</p>
      </div>
      
      {/* BUSCADOR */}
      <div className="search-wrapper">
        <input 
          className="search-input"
          value={ean} 
          onChange={(e) => setEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Escanea o escribe un EAN (Ej: 8806090972740)..."
          autoFocus
        />
        <button className="search-btn" onClick={buscar} disabled={loading}>
          {loading ? 'Analizando...' : 'Buscar'}
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
                brandColor="#00c3e3" // Cian Vibrante OnCity (Corregido)
            />
          </div>
      )}
    </div>
  );
}
