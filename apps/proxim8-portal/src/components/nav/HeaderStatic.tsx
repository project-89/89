import Link from "next/link";

// No need for isActive prop anymore since we're not doing client-side pathname checks
export default function HeaderStatic() {
  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="font-cyber text-xl tracking-wider text-primary-500 uppercase font-bold"
      >
        <div className="flex items-center">
          <span className="mr-1">Proxim8</span>
          <span className="text-xs font-terminal text-accent-blue ml-2 border-l border-primary-500/50 pl-2">
            Reality Engineering
          </span>
        </div>
      </Link>

      <nav className="hidden md:flex ml-8 space-x-6">
        <Link
          href="/"
          className="text-sm font-terminal uppercase text-gray-400 hover:text-primary-400 hover:border-b hover:border-primary-500/50"
        >
          [Home]
        </Link>
        <Link
          href="/nfts"
          className="text-sm font-terminal uppercase text-gray-400 hover:text-primary-400 hover:border-b hover:border-primary-500/50"
        >
          [Agents]
        </Link>
        <Link
          href="/lore"
          className="text-sm font-terminal uppercase text-gray-400 hover:text-accent-magenta hover:border-b hover:border-accent-magenta/50"
        >
          [Lore]
        </Link>
      </nav>
    </div>
  );
}
