import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mapa de dominios para corregir enlaces internos de VTEX
const DOMAIN_MAP = {
  'carrefourar': 'https://www.carrefour.com.ar',
  'fravega': 'https://www.fravega.com',
  'aremsaprod': 'https://www.oncity.com',
  'jumboargentina': 'https://www.jumbo.com.ar' // <--- NUEVO
};

async function fetchVtexProduct(accountName, ean, appKey = null, appToken = null) {
  try {
    const headers = { 'Accept': 'application/json' };
    if (appKey && appToken) {
      headers['X-VTEX-API-AppKey'] = appKey;
      headers['X-VTEX-API-AppToken'] = appToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Estrategia 1: Búsqueda Técnica (EAN)
    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&sc=1`;
    let res = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
    let data = res.ok ? await res.json() : [];

    // Estrategia 2: Texto (Respaldo)
    if (!Array.isArray(data) || data.length === 0) {
        url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}&sc=1`;
        res = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
        data = res.ok ? await res.json() : [];
    }
    
    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      let specs = {};
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      const description = item.description || item.metaTagDescription || "";
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;

      // Corrección de Link
      let publicLink = item.link;
      try {
        const urlObj = new URL(item.link);
        const publicDomain = DOMAIN_MAP[accountName];
        if (publicDomain) {
          publicLink = `${publicDomain}${urlObj.pathname}`;
        }
      } catch (e) {}
      
      if (offer) {
        return {
          found: true,
          store: accountName,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: publicLink,
          description: description,
          specs: specs
        };
      }
    }
    return { found: false, store: accountName };

  } catch (e) {
    return { found: false, store: accountName };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  const C_KEY = process.env.VTEX_APP_KEY;
  const C_TOKEN = process.env.VTEX_APP_TOKEN;

  // AHORA SON 4 TIENDAS
  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean, C_KEY, C_TOKEN),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('aremsaprod', ean), // OnCity
    fetchVtexProduct('jumboargentina', ean) // <--- JUMBO
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      oncity: results[2],
      jumbo: results[3] // <--- NUEVO
  });
}
