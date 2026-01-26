import { NextResponse } from 'next/server';

// Función auxiliar para consultar cualquier tienda VTEX
async function fetchVtexProduct(accountName, ean, appKey = null, appToken = null) {
  try {
    const headers = { 'Accept': 'application/json' };
    if (appKey && appToken) {
      headers['X-VTEX-API-AppKey'] = appKey;
      headers['X-VTEX-API-AppToken'] = appToken;
    }

    // Buscamos por EAN (alternateIds_Ean) que es el estándar de oro en VTEX
    const url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&sc=1`;
    
    const res = await fetch(url, { headers, cache: 'no-store' });
    
    if (!res.ok) return { found: false };
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      // Extraer Specs
      let specs = {};
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      // Extraer Descripción (HTML o Meta)
      const description = item.description || item.metaTagDescription;

      // Extraer Precio
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer && offer.Price > 0) {
        return {
          found: true,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: item.link,
          description: description,
          specs: specs
        };
      }
    }
    return { found: false };
  } catch (e) {
    console.error(`Error fetching ${accountName}:`, e);
    return { found: false, error: e.message };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  // Credenciales Carrefour (Frávega suele ser público)
  const C_KEY = process.env.VTEX_APP_KEY;
  const C_TOKEN = process.env.VTEX_APP_TOKEN;

  // Ejecutamos en paralelo
  const [carrefour, fravega] = await Promise.all([
    fetchVtexProduct('carrefourar', ean, C_KEY, C_TOKEN),
    fetchVtexProduct('fravega', ean) // Frávega API Publica
  ]);

  return NextResponse.json({ carrefour, fravega });
}
