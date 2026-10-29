export default function ConsultLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
        style={{backgroundImage: "url('/decor/parallax-bg.webp')"}}
      />
      {children}
    </>
  )
}
