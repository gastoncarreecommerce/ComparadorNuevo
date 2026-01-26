import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  console.log(`>>> Buscando EAN: ${ean}`);

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // Ejecución paralela
    const [meliRes, vtexRes] = await Promise.allSettled([
      // MeLi: Usamos el endpoint estándar SIN headers falsos para evitar bloqueo 403 por User-Agent sospechoso
      fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`),
      
      // Carrefour: Usamos 'fq=sku.ean' (Field Query) que es la forma técnica exacta de buscar barras en VTEX
      // Agregamos sc=1 (Sales Channel 1) que suele ser el Ecommerce principal
      fetch(`https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=sku.ean:${ean}&sc=1`, {
        headers: { 
            'X-VTEX-API-AppKey': VTEX_KEY || '', 
            'X-VTEX-API-AppToken': VTEX_TOKEN || '',
            'Accept': 'application/json'
        },
        cache: 'no-store'
      })
    ]);

    // --- PROCESAR MERCADO LIBRE ---
    let meli = { found: false };
    if (meliRes.status === 'fulfilled') {
        if (meliRes.value.ok) {
            const data = await meliRes.value.json();
            if (data.results?.length > 0) {
                const item = data.results[0];
                meli = { found: true, title: item.title, price: item.price, thumbnail: item.thumbnail, permalink: item.permalink };
            }
        } else {
            console.error(`[MeLi Error] Status: ${meliRes.value.status}`);
            // Si es 403, probablemente requiera una App registrada, pero probamos sin headers primero.
        }
    }

    // --- PROCESAR CARREFOUR ---
    let carrefour = { found: false };
    if (vtexRes.status === 'fulfilled') {
        if (vtexRes.value.ok) {
            const data = await vtexRes.value.json();
            console.log(`[Carrefour] Resultados brutos: ${data.length}`); // Log para confirmar

            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                // Buscamos el precio en el primer vendedor disponible
                const sellerInfo = item.items?.[0]?.sellers?.[0]?.commertialOffer;
                const price = sellerInfo?.Price || 0;
                
                // Solo mostramos si hay precio real
                if (price > 0) {
                    carrefour = { 
                        found: true, 
                        title: item.productName, 
                        price: price, 
                        thumbnail: item.items?.[0]?.images?.[0]?.imageUrl 
                    };
                }
            }
        } else {
            console.error(`[Carrefour Error] Status: ${vtexRes.value.status}`);
        }
    }

    return NextResponse.json({ meli, carrefour });

  } catch (e) {
    console.error(">>> ERROR FATAL:", e);
    return NextResponse.json({ meli: { found: false }, carrefour: { found: false }, error: e.message });
  }
}
