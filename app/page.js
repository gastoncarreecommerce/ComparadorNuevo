// Componente Reutilizable para Tarjeta VTEX
  const VtexCard = ({ product, storeName, color }) => {
    if (!product || !product.found) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', height: '100%' }}>
                <h3 style={{ color: color, marginTop: 0 }}>{storeName}</h3>
                <p style={{ color: '#888', fontStyle: 'italic' }}>Producto no encontrado.</p>
            </div>
        );
    }

    return (
      <div style={{ border: `1px solid ${color}`, borderRadius: '12px', padding: '20px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                    maxHeight: '100px', 
                    overflowY: 'auto', 
                    fontSize: '13px', 
                    color: '#666', 
                    lineHeight: '1.4',
                    border: '1px solid #f0f0f0',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#fafafa'
                }}
            />
        </div>

        {/* Ficha Técnica (TODA LA INFO) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>Ficha Técnica Completa</p>
            <div style={{ 
                flex: 1, 
                maxHeight: '250px', // Altura fija con scroll para comparar mejor
                overflowY: 'auto', 
                border: '1px solid #eee', 
                borderRadius: '8px',
                padding: '0 10px'
            }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {/* Quitamos el .slice(0,5) para mostrar TODO */}
                    {Object.entries(product.specs).map(([key, value]) => (
                        <li key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#444', marginRight: '10px' }}>{key}</span>
                            <span style={{ color: '#666', textAlign: 'right', wordBreak: 'break-word', maxWidth: '60%' }}>{value}</span>
                        </li>
                    ))}
                </ul>
                {Object.keys(product.specs).length === 0 && <p style={{fontSize:'12px', color:'#ccc', textAlign:'center'}}>Sin ficha técnica.</p>}
            </div>
        </div>
      </div>
    );
  };
