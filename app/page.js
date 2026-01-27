'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para la IA
  const [aiContent, setAiContent] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const buscar = async () => {
    if (!ean) return;
    setLoading(true);
    setData(null);
    setAiContent(''); // Limpiar IA anterior
    try {
      const res = await fetch(`/api/compare?ean=${ean}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const generarDescripcionIA = async () => {
    if (!data) return;
    setLoadingAi(true);
    
    // Recopilamos la data de las 3 tiendas
    const payload = {
        title: data.fravega?.title || data.carrefour?.title || "Producto",
        descriptions: [
            data.carrefour?.description,
            data.fravega?.description,
            data.oncity?.description
        ],
        specs: { ...data.carrefour?.specs, ...data.fravega?.specs }
    };

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.result) {
            // Limpiamos los backticks de markdown si la IA los manda
            const cleanHtml = json.result.replace(/```html/g, '').replace(/```/g, '');
            setAiContent(cleanHtml);
        }
    } catch (e) {
        console.error(e);
        alert("Error al conectar con la IA");
    }
    setLoadingAi(false);
  };

  // --- UI COMPONENTS ---
  const Badge = ({ children, color }) => (
    <span style={{ backgroundColor: `${color}15`, color: color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', border: `1px solid ${color}40` }}>
      {children}
    </span>
  );

  const ProductCard = ({ product, storeName, brandColor }) => {
    const [activeTab, setActiveTab] = useState('desc');
    
    if (!product || !product.found) return (
        <div className="card empty-card">
            <div style={{ opacity: 0.5, textAlign: 'center' }}>
                <h3 style={{ color: '#aaa', margin: 0 }}>{storeName}</h3>
                <p style={{ fontSize: '12px', color: '#888' }}>Sin datos</p>
            </div>
        </div>
    );

    return (
      <div className="card" style={{ borderTop: `4px solid ${brandColor}` }}>
        <div className="card-header">
            <Badge color={brandColor}>{storeName}</Badge>
            <span style={{fontSize:'12px', fontWeight:'bold', color: product.price > 0 ? '#10b981' : '#ef4444'}}>
                {product.price > 0 ? `$${product.price.toLocaleString('es-AR')}` : 'Sin Stock'}
            </span>
        </div>
        
        <div className="product-hero">
            <img src={product.thumbnail} alt={product.title} />
            <a href={product.link} target="_blank" className="product-title">{product.title} 🔗</a>
        </div>

        <div className="tabs">
            <button className={`tab-btn ${activeTab === 'desc' ? 'active' : ''}`} onClick={() => setActiveTab('desc')}>Descripción</button>
            <button className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => setActiveTab('specs')}>Ficha</button>
        </div>

        <div className="tab-content custom-scroll">
            {activeTab === 'desc' && <div className="html-desc" dangerouslySetInnerHTML={{ __html: product.description || '<p>Vacío</p>' }} />}
            {activeTab === 'specs' && (
                <ul className="specs-list">
                    {Object.entries(product.specs).map(([k, v]) => (
                        <li key={k}><strong>{k}</strong><span>{v}</span></li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <style jsx global>{`
        body { background-color: #f8fafc; color: #0f172a; font-family: sans-serif; margin: 0; }
        .container { max-width: 1300px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        
        /* BUSCADOR */
        .search-wrapper { background: white; padding: 10px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; gap: 10px; max-width: 600px; margin: 0 auto 20px auto; }
        .search-input { flex: 1; border: none; padding: 10px; font-size: 16px; outline: none; }
        .search-btn { background: #0f172a; color: white; border: none; padding: 0 25px; border-radius: 8px; cursor: pointer; }
        
        /* IA GENERATOR SECTION */
        .ai-panel { background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 1px solid #bae6fd; padding: 20px; border-radius: 16px; margin-bottom: 40px; text-align: center; }
        .ai-btn { background: linear-gradient(90deg, #4f46e5, #06b6d4); color: white; border: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 10px rgba(6,182,212,0.3); transition: transform 0.2s; }
        .ai-btn:hover { transform: scale(1.05); }
        .ai-btn:disabled { opacity: 0.7; cursor: wait; }
        .ai-result { text-align: left; margin-top: 20px; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative; }
        .copy-btn { position: absolute; top: 10px; right: 10px; background: #f1f5f9; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; }

        /* GRID */
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        
        /* CARDS */
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); height: 600px; display: flex; flex-direction: column; }
        .empty-card { border: 2px dashed #cbd5e1; background: #f8fafc; box-shadow: none; justify-content: center; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .product-hero { text-align: center; margin-bottom: 15px; }
        .product-hero img { height: 100px; object-fit: contain; }
        .product-title { display: block; font-size: 14px; font-weight: 600; color: #334155; text-decoration: none; margin-top: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* TABS & CONTENT */
        .tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
        .tab-btn { flex: 1; background: none; border: none; padding: 10px; font-size: 12px; font-weight: 600; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #0f172a; border-bottom-color: #0f172a; }
        .tab-content { flex: 1; overflow-y: auto; padding-top: 15px; font-size: 13px; color: #475569; line-height: 1.5; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        
        /* HTML Content Styles */
        .html-desc img { max-width: 100%; height: auto; margin: 10px 0; }
        .specs-list { padding: 0; list-style: none; }
        .specs-list li { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
        .specs-list li strong { color: #334155; }
      `}</style>

      <div className="header">
        <h1>V-Intel <span style={{fontSize:'0.5em', verticalAlign:'super', color:'#4f46e5'}}>AI</span></h1>
      </div>
      
      <div className="search-wrapper">
        <input className="search-input" value={ean} onChange={(e) => setEan(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscar()} placeholder="EAN (Ej: 8806090972740)" />
        <button className="search-btn" onClick={buscar} disabled={loading}>{loading ? '...' : 'Buscar'}</button>
      </div>

      {/* SECCIÓN IA: Solo aparece si ya buscamos algo */}
      {data && (
        <div className="ai-panel">
            <button className="ai-btn" onClick={generarDescripcionIA} disabled={loadingAi}>
                {loadingAi ? '✨ Redactando con IA...' : '✨ Generar Ficha Maestra con IA'}
            </button>
            
            {aiContent && (
                <div className="ai-result">
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText(aiContent)}>Copiar HTML</button>
                    <div dangerouslySetInnerHTML={{ __html: aiContent }} />
                </div>
            )}
        </div>
      )}

      {data && (
          <div className="grid">
            <ProductCard product={data.carrefour} storeName="Carrefour" brandColor="#1e429f" />
            <ProductCard product={data.fravega} storeName="Frávega" brandColor="#7526d9" />
            <ProductCard product={data.oncity} storeName="OnCity" brandColor="#00c3e3" />
          </div>
      )}
    </div>
  );
}
