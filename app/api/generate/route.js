import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    // 1. Validar API KEY
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la GOOGLE_API_KEY en Vercel.' }, { status: 500 });
    }

    // 2. Validar Body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'El JSON enviado no es válido.' }, { status: 400 });
    }

    const { title, descriptions, specs } = body;

    if (!title && !descriptions) {
       return NextResponse.json({ error: 'No hay datos suficientes para generar (faltan título o descripciones).' }, { status: 400 });
    }

    // 3. Configurar IA
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Limpiamos descripciones vacías para no confundir a la IA
    const cleanDescriptions = descriptions?.filter(d => d && d.trim().length > 0) || [];

    const prompt = `
      Actúa como experto en Copywriting para E-commerce.
      Genera una ficha de producto en HTML limpio (sin etiquetas <html>, ni markdown \`\`\`) para: "${title || 'Producto'}".

      Fuentes de información:
      ${cleanDescriptions.join('\n\n')}

      Datos técnicos:
      ${JSON.stringify(specs)}

      Estructura requerida:
      <h2>[Título Persuasivo]</h2>
      <p>[Párrafo de introducción enfocado en beneficios]</p>
      <h3>Características Destacadas</h3>
      <ul><li>[Beneficio 1]</li><li>[Beneficio 2]</li></ul>
    `;

    // 4. Llamada a Google (Protegida)
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("❌ ERROR DETALLADO IA:", error);
    
    // Devolvemos el mensaje exacto del error para que lo veas en la pantalla
    return NextResponse.json({ 
        error: 'Error al procesar con IA', 
        details: error.message || String(error) 
    }, { status: 500 });
  }
}
