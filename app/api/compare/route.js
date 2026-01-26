import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  // LOG PARA VER EN VERCEL
  console.log(`>>> Buscando EAN: ${ean}`);

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // Headers para simular un navegador real (evita bloqueos)
    const headersCommon = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    // ESTRATEGIA NUEVA: Usamos 'ft' (Full Text) en lugar de 'fq' (Filter Query) para Carrefour
    // Esto imita la búsqueda de la barra del sitio web.
    const [meliRes, vtexRes] = await Promise.allSettled([
      fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`, { headers: headersCommon }),
      fetch(`https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`, {
        headers: { 
            ...headersCommon,
            'X-VTEX-API-AppKey': VTEX_KEY || '', 
            'X-VTEX-API-AppToken': VTEX_TOKEN || '',
            'Accept': 'application/json'
        },
        cache: 'no-store'
      })
    ]);

    // Procesar Mercado Libre
    let meli = { found: false };
    if (meliRes.status === 'fulfilled' && meliRes.value.ok) {
        const data = await meliRes.value.json();
        console.log(`   [MeLi] Resultados encontrados: ${data.paging?.total || 0}`); // CHIVATO
        
        if (data.results?.length > 0) {
            const item = data.results[0];
            meli = { found: true, title: item.title, price: item.price, thumbnail: item.thumbnail, permalink: item.permalink };
        }
    } else {
        console.error(`   [MeLi] Error API: ${meliRes.status === 'fulfilled' ? meliRes.value.status : meliRes.reason}`);
    }

    // Procesar Carrefour (VTEX)
    let carrefour = { found: false };
    if (vtexRes.status === 'fulfilled') {
        if (vtexRes.value.ok) {
            const data = await vtexRes.value.json();
            console.log(`   [Carrefour] Resultados encontrados: ${data.length || 0}`); // CHIVATO

            if (Array.isArray(data) && data.length > 0) {
                // Buscamos el primer item disponible
                const item = data[0];
                const sellerInfo = item.items?.[0]?.sellers?.[0]?.commertialOffer;
                
                // Aseguramos que haya precio > 0, sino buscamos otro
                const price = sellerInfo?.Price || 0;
                const available = sellerInfo?.AvailableQuantity > 0;

                carrefour = { 
                    found: true, 
                    title: item.productName, 
                    price: price, 
                    thumbnail: item.items?.[0]?.images?.[0]?.imageUrl,
                    available: available
                };
            }
        } else {
            const errorText = await vtexRes.value.text();
            console.error(`   [Carrefour] Error VTEX: ${vtexRes.value.status} - ${errorText.substring(0, 100)}`);
        }
    }

    return NextResponse.json({ meli, carrefour });

  } catch (e) {
    console.error(">>> ERROR CRÍTICO:", e);
    return NextResponse.json({ meli: { found: false }, carrefour: { found: false }, error: e.message });
  }
}
