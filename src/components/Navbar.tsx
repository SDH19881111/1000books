'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/',        icon: '🏠', label: '홈' },
  { href: '/books',   icon: '📚', label: '내 책' },
  { href: '/world',   icon: '🐻', label: '책별 마을' },
  { href: '/map',     icon: '🗺️', label: '지도' },
  { href: '/rewards', icon: '🎁', label: '보상' },
  { href: '/admin',   icon: '👩', label: '관리자' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
      <div className="mx-3 mb-3 glass-card rounded-3xl shadow-xl shadow-pink-200/50 px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-pink-200/70'
                      : 'hover:bg-pink-100/50'
                  }`}
                >
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      isActive ? 'text-pink-600' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-0.5"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
