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
    
    // Timeout de 4s para que no se cuelgue si una tienda tarda
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
      
      // 1. Extraer Specs (Atributos técnicos)
      let specs = {};
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      // 2. Extraer Descripción (HTML rico para tu catálogo)
      const description = item.description || item.metaTagDescription || "";

      // 3. Extraer Precio (Si hay stock)
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      // Nota: A veces queremos la info aunque no haya stock/precio. 
      // Si solo quieres info para catálogo, podrías quitar la validación de 'offer.Price > 0'
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

  // COMPARACIÓN TRIPLE: Carrefour vs Frávega vs Jumbo
  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean, C_KEY, C_TOKEN),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('jumboargentina', ean) // <--- NUEVO: Jumbo
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      jumbo: results[2]
  });
}
