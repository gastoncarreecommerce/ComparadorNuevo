import { NextResponse } from 'next/server';

// Forzamos entorno Node.js para estabilidad
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Validar API Key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta API Key en Vercel' }, { status: 500 });
    }

    // 2. Leer datos
    const body = await request.json();
    const { title, descriptions, specs } = body;

    // 3. Preparar el Prompt
    const prompt = `
      Actúa como experto en E-commerce.
      Crea una descripción HTML (solo el contenido div, sin markdown) para: "${title || 'Producto'}".
      
      Info base:
      ${descriptions?.filter(d => d).join('\n') || ''}
      
      Specs:
      ${JSON.stringify(specs)}

      Estructura requerida:
      <h2>[Título Persuasivo]</h2>
      <p>[Intro]</p>
      <h3>Características</h3>
      <ul><li>...</li></ul>
    `;

    // 4. CONEXIÓN DIRECTA ACTUALIZADA (Gemini 1.5 Flash + v1beta)
    // Cambiamos 'gemini-pro' por 'gemini-1.5-flash' que es el modelo actual rápido y soportado.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    const data = await response.json();

    // 5. Manejo de errores específicos de Google
    if (!response.ok) {
        console.error("Error Google API:", data);
        // Devolvemos el mensaje exacto que nos da Google para depurar
        return NextResponse.json({ 
            error: 'Error de Google', 
            details: data.error?.message || JSON.stringify(data)
        }, { status: response.status });
    }

    // 6. Extraer texto
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
        return NextResponse.json({ error: 'La IA no devolvió texto.' }, { status: 500 });
    }

    return NextResponse.json({ result: generatedText });

  } catch (error) {
    console.error("Error Servidor:", error);
    return NextResponse.json({ 
        error: 'Error interno', 
        details: error.message 
    }, { status: 500 });
  }
}
