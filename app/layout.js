export const metadata = {
  title: 'Comparador EAN',
  description: 'Carrefour vs MeLi',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f4f4f5' }}>
        {children}
      </body>
    </html>
  )
}
