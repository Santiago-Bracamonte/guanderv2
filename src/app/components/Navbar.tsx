import Link from "next/link";

const navLinks = [
  { label: "Inicio", href: "/", active: true },
  { label: "Tiendas", href: "#tiendas" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-[#43D696] text-2xl font-bold">✶</span>
        <span className="text-white font-bold text-xl tracking-tight">Guander</span>
      </Link>
      <ul className="flex items-center gap-8">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.active
                  ? "text-[#43D696]"
                  : "text-white hover:text-[#43D696]"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/local/dashboard"
        className="rounded-full border border-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
      >
        Dashboard Local
      </Link>
    </nav>
  );
}
