// app/page.js
'use client';
import { useState } from 'react';

export default function Home() {
  const [ean, setEan] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!ean) return;
    setLoading(true);
    setResult(null);

    // Llamamos a NUESTRA propia API, no a las externas
    const res = await fetch(`/api/compare?ean=${ean}`);
    const data = await res.json();
    
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Comparador EAN</h1>
        
        {/* Buscador */}
        <div className="flex gap-2 mb-10 justify-center">
          <input 
            type="text" 
            placeholder="Ingresa código EAN (ej: 7791290790978)" 
            className="p-3 border rounded w-full max-w-md"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Buscando...' : 'Comparar'}
          </button>
        </div>

        {/* Resultados */}
        {result && (
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Tarjeta MELI */}
            <div className="bg-white p-6 rounded shadow border-t-4 border-yellow-400">
              <h2 className="text-xl font-bold mb-4 text-yellow-600">Mercado Libre</h2>
              {result.meli.found ? (
                <>
                  <img src={result.meli.image} alt="Meli" className="h-32 mx-auto mb-4 object-contain"/>
                  <h3 className="font-semibold">{result.meli.title}</h3>
                  <p className="text-2xl font-bold mt-2">$ {result.meli.price.toLocaleString()}</p>
                  <a href={result.meli.link} target="_blank" className="block mt-4 text-blue-500 hover:underline">Ver Publicación</a>
                </>
              ) : (
                <p className="text-gray-500">No encontrado en MeLi</p>
              )}
            </div>

            {/* Tarjeta Carrefour */}
            <div className="bg-white p-6 rounded shadow border-t-4 border-blue-600">
              <h2 className="text-xl font-bold mb-4 text-blue-800">Carrefour</h2>
              {result.carrefour.found ? (
                <>
                  <img src={result.carrefour.image} alt="Carrefour" className="h-32 mx-auto mb-4 object-contain"/>
                  <h3 className="font-semibold">{result.carrefour.title}</h3>
                  <p className="text-2xl font-bold mt-2">$ {result.carrefour.price.toLocaleString()}</p>
                  <a href="#" className="block mt-4 text-blue-500 hover:underline">Ver en Web</a>
                </>
              ) : (
                <p className="text-gray-500">No encontrado en VTEX</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
