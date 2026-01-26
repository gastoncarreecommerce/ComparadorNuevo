import { NextResponse } from 'next/server';

// Función genérica para consultar cualquier VTEX
async function fetchVtexProduct(accountName, ean, appKey = null, appToken = null) {
  try {
    const headers = { 'Accept': 'application/json' };
    if (appKey && appToken) {
      headers['X-VTEX-API-AppKey'] = appKey;
      headers['X-VTEX-API-AppToken'] = appToken;
    }

    // Buscamos por EAN (La llave maestra de VTEX)
    const url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&sc=1`;
    
    // Timeout de 4s para evitar cuellos de botella
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { 
        headers, 
        cache: 'no-store',
        signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return { found: false, store: accountName };
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      // 1. Extraer Specs
      let specs = {};
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      // 2. Extraer Descripción
      const description = item.description || item.metaTagDescription || "";

      // 3. Extraer Precio
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer) {
        return {
          found: true,
          store: accountName,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: item.link,
          description: description,
          specs: specs
        };
      }
    }
    return { found: false, store: accountName };
  } catch (e) {
    console.error(`Error fetching ${accountName}:`, e.message);
    return { found: false, store: accountName };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  const C_KEY = process.env.VTEX_APP_KEY;
  const C_TOKEN = process.env.VTEX_APP_TOKEN;

  // COMPARACIÓN: Carrefour vs Frávega vs OnCity
  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean, C_KEY, C_TOKEN),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('oncityar', ean) // <--- CAMBIO: OnCity en lugar de Jumbo
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      oncity: results[2]
  });
}
