import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Usamos un EAN genérico de Coca Cola si no pasas uno, para asegurar que el producto EXISTA.
  const ean = searchParams.get('ean') || '7790895000997'; 
  const account = 'jumboargentinaio';

  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  const results = {};

  // PRUEBA 1: API Clásica de Catálogo (Busqueda por EAN)
  try {
    const url1 = `https://${account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}`;
    const res1 = await fetch(url1, { headers });
    results.classic_api = {
      url: url1,
      status: res1.status,
      ok: res1.ok,
      data: res1.ok ? await res1.json() : await res1.text() // Si falla, vemos el texto del error
    };
  } catch (e) {
    results.classic_api = { error: e.message };
  }

  // PRUEBA 2: API de Búsqueda Texto (FT)
  try {
    const url2 = `https://${account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`;
    const res2 = await fetch(url2, { headers });
    results.text_search = {
      url: url2,
      status: res2.status,
      data: res2.ok ? await res2.json() : await res2.text()
    };
  } catch (e) {
    results.text_search = { error: e.message };
  }

  // PRUEBA 3: Intelligent Search (API Nueva de VTEX IO)
  // A veces las tiendas IO SOLO responden a esta API
  try {
    const url3 = `https://${account}.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search?query=${ean}`;
    const res3 = await fetch(url3, { headers });
    results.intelligent_search = {
      url: url3,
      status: res3.status,
      data: res3.ok ? await res3.json() : await res3.text()
    };
  } catch (e) {
    results.intelligent_search = { error: e.message };
  }

  return NextResponse.json({ 
    diagnostico_jumbo: results,
    account_used: account,
    ean_tested: ean
  });
}
