import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOMAIN_MAP = {
  'carrefourar': 'https://www.carrefour.com.ar',
  'fravega': 'https://www.fravega.com',
  'aremsaprod': 'https://www.oncity.com',
  'jumboargentinaio': 'https://www.jumbo.com.ar'
};

// Función genérica con "Disfraz" de Navegador
async function fetchVtexProduct(accountName, ean) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    // Headers que simulan ser un Chrome real (Vital para Jumbo)
    const headers = { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    };

    // --- CORRECCIÓN CRÍTICA AQUÍ ---
    // Quitamos "&sc=1" de las URLs. Jumbo usa sc=32. Al quitarlo, VTEX busca en todos.
    
    // 1. Intentamos búsqueda exacta (EAN)
    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}`;
    
    let res = await fetch(url, { headers, signal: controller.signal });
    let data = res.ok ? await res.json() : [];

    // 2. Si falla, intentamos búsqueda por texto (Plan B)
    if (!Array.isArray(data) || data.length === 0) {
        url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`;
        res = await fetch(url, { headers, signal: controller.signal });
        data = res.ok ? await res.json() : [];
    }
    
    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      let specs = {};
      if (item.allSpecifications) {
        item.allSpecifications.forEach(specName => {
            if (item[specName]?.[0]) specs[specName] = item[specName][0];
        });
      }

      // Corrección de Link para que lleve a la web pública
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
          description: item.description || "",
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
