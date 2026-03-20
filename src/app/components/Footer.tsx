const legalLinks = [
  { label: "Términos y Condiciones", href: "#" },
  { label: "Política de Privacidad", href: "#" },
  { label: "Preguntas Frecuentes", href: "#" },
  { label: "Contacto", href: "#" },
];

const professionalLinks = [
  { label: "Registrar mi Local", href: "#" },
  { label: "Cómo Adherirse", href: "#" },
  { label: "Centro de Ayuda", href: "#" },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#c8cfc0" }}>
      <div className="max-w-7xl mx-auto px-8 py-14">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-xl" style={{ color: "#3a3f36" }}>
              Guander
            </span>
            <p className="text-sm leading-relaxed" style={{ color: "#3a3f36" }}>
              La plataforma que conecta dueños de mascotas con locales y
              servicios pet-friendly. Descubre, visita y acumula recompensas.
            </p>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-base" style={{ color: "#3a3f36" }}>
              Legal
            </span>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ color: "#3a3f36" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Para Profesionales */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-base" style={{ color: "#3a3f36" }}>
              Para Profesionales
            </span>
            <ul className="flex flex-col gap-2">
              {professionalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ color: "#3a3f36" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes Sociales */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-base" style={{ color: "#3a3f36" }}>
              Redes Sociales
            </span>
            <div className="flex items-center gap-4">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="transition-opacity hover:opacity-70"
                style={{ color: "#3a3f36" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="transition-opacity hover:opacity-70"
                style={{ color: "#3a3f36" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="#"
                aria-label="Twitter"
                className="transition-opacity hover:opacity-70"
                style={{ color: "#3a3f36" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="#"
                aria-label="YouTube"
                className="transition-opacity hover:opacity-70"
                style={{ color: "#3a3f36" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-10" style={{ borderColor: "#a8b09a" }} />

        {/* Copyright */}
        <p className="text-center text-sm" style={{ color: "#3a3f36" }}>
          © 2025 Guander. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
