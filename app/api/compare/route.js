import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ found: false });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // Intentamos búsqueda técnica (fq) y búsqueda de texto (ft) en paralelo para asegurar resultados
    // sc=1 fuerza el stock del canal de ecommerce
    const urlBase = `https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search`;
    
    // Probamos 2 estrategias contra VTEX:
    // 1. Por GTIN/EAN directo (fq)
    // 2. Por texto libre (ft)
    const [resFq, resFt] = await Promise.all([
        fetch(`${urlBase}?fq=Gtin:${ean}&sc=1`, {
            headers: { 'X-VTEX-API-AppKey': VTEX_KEY, 'X-VTEX-API-AppToken': VTEX_TOKEN, 'Accept': 'application/json' }
        }),
        fetch(`${urlBase}?ft=${ean}&sc=1`, {
            headers: { 'X-VTEX-API-AppKey': VTEX_KEY, 'X-VTEX-API-AppToken': VTEX_TOKEN, 'Accept': 'application/json' }
        })
    ]);

    let products = [];
    
    // Si la búsqueda técnica funciona, la usamos
    if (resFq.ok) products = await resFq.json();
    
    // Si no, probamos la de texto (si no vino nada antes)
    if ((!products || products.length === 0) && resFt.ok) {
        products = await resFt.json();
    }

    if (Array.isArray(products) && products.length > 0) {
        const item = products[0];
        // Buscar precio disponible
        const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
        
        if (offer && offer.Price > 0) {
            return NextResponse.json({
                found: true,
                title: item.productName,
                price: offer.Price,
                thumbnail: item.items[0].images[0].imageUrl
            });
        }
    }

    return NextResponse.json({ found: false });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ found: false, error: e.message });
  }
}
