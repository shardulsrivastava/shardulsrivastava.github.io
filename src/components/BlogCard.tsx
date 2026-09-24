'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface BlogCardProps {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  featured?: boolean
}

export default function BlogCard({
  id,
  title,
  excerpt,
  date,
  category,
  tags,
  featured = false,
}: BlogCardProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      whileHover={{ y: -4 }}
      className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      {/* Background with gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/20 to-[#ff006e]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

      {/* Card Content */}
      <div className="relative bg-[#0a0e27]/40 backdrop-blur-md border border-[#00d4ff]/20 group-hover:border-[#00d4ff]/60 transition-all duration-300 rounded-2xl p-6 sm:p-8 h-full hover:shadow-[0_0_40px_rgba(0,212,255,0.2)]">
        {/* Shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent blur-3xl opacity-20 animate-shimmer"></div>
        </div>

        <div className="relative z-10">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="inline-block px-3 py-1 bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27] text-xs font-bold rounded-full shadow-lg shadow-[#00d4ff]/30"
            >
              {category}
            </motion.span>
            <span className="text-xs text-[#b0bec5]">{date}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-[#00d4ff] mb-3 group-hover:text-[#ff006e] transition-colors duration-300 line-clamp-2">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-[#b0bec5] mb-4 line-clamp-3 leading-relaxed">{excerpt}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {tags.slice(0, 3).map((tag, index) => (
              <motion.span
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-xs px-2 py-1 rounded-md bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:border-[#00d4ff] transition-colors duration-300"
              >
                #{tag}
              </motion.span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs px-2 py-1 text-[#b0bec5]">+{tags.length - 3} more</span>
            )}
          </div>

          {/* Read More Link */}
          <motion.div
            whileHover={{ x: 5 }}
            className="inline-flex items-center gap-2 text-[#00d4ff] font-semibold hover:text-[#ff006e] transition-colors duration-300"
          >
            <Link href={`/blog/${id}`}>Read More</Link>
            <motion.span whileHover={{ x: 3 }}>→</motion.span>
          </motion.div>
        </div>

        {/* Accent Line */}
        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#00d4ff] to-[#ff006e] group-hover:w-full transition-all duration-300"></div>
      </div>
    </motion.div>
  )
}
