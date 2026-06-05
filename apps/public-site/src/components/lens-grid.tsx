"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import type { Lens } from "@portfolio/types";

interface LensGridProps {
  lenses: Lens[];
}

export function LensGrid({ lenses }: LensGridProps) {
  if (lenses.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {lenses.map((lens, index) => (
        <motion.div
          key={lens.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.35 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={`/lenses/${lens.slug}`}
            className="glass-panel block min-h-52 rounded-lg p-5 transition hover:bg-white/8"
            style={{ "--lens-accent": lens.accentColor } as CSSProperties}
          >
            <div
              className="mb-8 h-1.5 w-12 rounded-full"
              style={{ backgroundColor: "var(--lens-accent)" }}
            />
            <h3 className="text-xl font-semibold text-ink">{lens.name}</h3>
            {lens.summary ? (
              <p className="mt-4 text-sm leading-6 text-muted">{lens.summary}</p>
            ) : null}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
