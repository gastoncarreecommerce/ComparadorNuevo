// app/api/compare/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) {
    return NextResponse.json({ error: 'EAN es requerido' }, { status: 400 });
  }

  try {
    // 1. Configurar credenciales desde variables de entorno
    const VTEX_ACCOUNT = process.env.VTEX_ACCOUNT; // 'carrefourar'
    const VTEX_APP_KEY = process.env.VTEX_APP_KEY;
    const VTEX_APP_TOKEN = process.env.VTEX_APP_TOKEN;

    // 2. Ejecutar promesas en paralelo
    const [meliRes, vtexRes] = await Promise.allSettled([
      fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`),
      fetch(`https://vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=Gtin:${ean}`, {
        headers: {
          'X-VTEX-API-AppKey': VTEX_APP_KEY,
          'X-VTEX-API-AppToken': VTEX_APP_TOKEN,
          'Accept': 'application/json'
        }
      })
    ]);

    // 3. Procesar respuesta de Mercado Libre
    let meliData = null;
    if (meliRes.status === 'fulfilled') {
      const data = await meliRes.value.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        meliData = {
          found: true,
          title: item.title,
          price: item.price,
          image: item.thumbnail,
          link: item.permalink,
          seller: item.seller?.nickname
        };
      }
    }

    // 4. Procesar respuesta de VTEX (Carrefour)
    let vtexData = null;
    if (vtexRes.status === 'fulfilled') {
      const data = await vtexRes.value.json(); // VTEX devuelve array directo
      if (data && data.length > 0) {
        const product = data[0];
        const sku = product.items[0]; // Tomamos el primer SKU
        const seller = sku.sellers.find(s => s.sellerDefault) || sku.sellers[0];
        
        vtexData = {
          found: true,
          title: product.productName,
          price: seller.commertialOffer.Price,
          image: sku.images[0]?.imageUrl,
          link: product.linkText // Ojo: A veces hay que construir la URL completa
        };
      }
    }

    // 5. Devolver JSON unificado al Front
    return NextResponse.json({
      ean_buscado: ean,
      meli: meliData || { found: false },
      carrefour: vtexData || { found: false }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
