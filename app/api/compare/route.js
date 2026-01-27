import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOMAIN_MAP = {
  'carrefourar': 'https://www.carrefour.com.ar',
  'fravega': 'https://www.fravega.com',
  'aremsaprod': 'https://www.oncity.com',
  'jumboargentinaio': 'https://www.jumbo.com.ar'
};

async function fetchVtexProduct(accountName, ean) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // --- CONFIGURACIÓN DE HEADERS DIFERENCIADA ---
    let headers = { 
        'Accept': 'application/json' 
    };

    // SOLO nos disfrazamos para JUMBO (porque tiene firewall)
    // A Carrefour y Frávega no les mandamos esto porque se pueden romper.
    if (accountName.includes('jumbo')) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // 1. Búsqueda por EAN
    // Quitamos el "&sc=1" para evitar problemas con Jumbo (sc=32) y otros.
    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}`;
    
    let res = await fetch(url, { headers, signal: controller.signal });
    let data = res.ok ? await res.json() : [];

    // 2. Fallback: Búsqueda por Texto
    if (!Array.isArray(data) || data.length === 0) {
        url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`;
        res = await fetch(url, { headers, signal: controller.signal });
        data = res.ok ? await res.json() : [];
    }
    
    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      // Extraer Specs
      let specs = {};
      if (item.allSpecifications) {
        item.allSpecifications.forEach(specName => {
            if (item[specName]?.[0]) specs[specName] = item[specName][0];
        });
      }

      // --- RESCATE DE DESCRIPCIÓN ---
      // Prioridad: 1. Description, 2. MetaTag, 3. Specs ocultas
      let description = item.description || item.metaTagDescription || "";
      
      if (!description || description.length < 10) {
          const hiddenFields = ['Descripción', 'Descripcion', 'Marketing', 'Presentación', 'Caracteristicas generales'];
          for (const field of hiddenFields) {
              if (specs[field]) {
                  description = specs[field];
                  break;
              }
              // A veces Carrefour lo pone en la raíz con nombre en español
              if (item[field] && item[field][0]) {
                  description = item[field][0];
                  break;
              }
          }
      }

      // Link público
      let publicLink = item.link;
      const domain = DOMAIN_MAP[accountName];
      if (domain && item.link) {
          try { publicLink = `${domain}${new URL(item.link).pathname}`; } catch(e){}
      }

      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
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
    console.error(`Error en ${accountName}:`, e.message);
    return { found: false, store: accountName };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('aremsaprod', ean),
    fetchVtexProduct('jumboargentinaio', ean)
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      oncity: results[2],
      jumbo: results[3]
  });
}
