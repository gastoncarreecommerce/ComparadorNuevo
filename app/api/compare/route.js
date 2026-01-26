import { NextResponse } from 'next/server';

// Mapa de dominios públicos para corregir los enlaces de VTEX
const DOMAIN_MAP = {
  'carrefourar': 'https://www.carrefour.com.ar',
  'fravega': 'https://www.fravega.com',
  'aremsaprod': 'https://www.oncity.com'
};

// Función "Blindada" para consultar VTEX (Intenta EAN exacto, y si falla, busca texto)
async function fetchVtexProduct(accountName, ean, appKey = null, appToken = null) {
  try {
    const headers = { 'Accept': 'application/json' };
    if (appKey && appToken) {
      headers['X-VTEX-API-AppKey'] = appKey;
      headers['X-VTEX-API-AppToken'] = appToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // ESTRATEGIA 1: Búsqueda Técnica (Exacta por EAN)
    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&sc=1`;
    
    let res = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
    let data = res.ok ? await res.json() : [];

    // ESTRATEGIA 2: Búsqueda de Texto (Si la técnica falló)
    if (!Array.isArray(data) || data.length === 0) {
        url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}&sc=1`;
        res = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
        data = res.ok ? await res.json() : [];
    }
    
    clearTimeout(timeoutId);

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

      // Extraer Descripción
      const description = item.description || item.metaTagDescription || "";

      // Extraer Precio
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;

      // --- CORRECCIÓN DE ENLACE ---
      let publicLink = item.link;
      try {
        // Extraemos el path (ej: /producto/p) y le ponemos el dominio público
        const urlObj = new URL(item.link);
        const publicDomain = DOMAIN_MAP[accountName];
        if (publicDomain) {
          publicLink = `${publicDomain}${urlObj.pathname}`;
        }
      } catch (error) {
        console.error(`Error construyendo enlace público para ${accountName}:`, error);
      }
      
      if (offer) {
        return {
          found: true,
          store: accountName,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: publicLink, // <--- Usamos el enlace corregido
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

  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean, C_KEY, C_TOKEN),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('aremsaprod', ean) // Cuenta real de OnCity
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      oncity: results[2]
  });
}
