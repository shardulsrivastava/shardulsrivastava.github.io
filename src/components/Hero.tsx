'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-[#00d4ff] rounded-full mix-blend-screen filter blur-3xl opacity-10"
        animate={{
          x: mousePosition.x * 0.05,
          y: mousePosition.y * 0.05,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 50 }}
      ></motion.div>

      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#ff006e] rounded-full mix-blend-screen filter blur-3xl opacity-10"
        animate={{
          x: -mousePosition.x * 0.05,
          y: -mousePosition.y * 0.05,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 50 }}
      ></motion.div>

      <div className="relative z-10 text-center max-w-4xl">
        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-[#00d4ff] via-[#8338ec] to-[#ff006e] bg-clip-text text-transparent animate-gradient-shift"
        >
          Shardul's Tech Hub
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-2xl text-[#b0bec5] mb-4 font-light"
        >
          Cloud Infrastructure • Data Engineering • System Design
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[#b0bec5] text-lg mb-8 max-w-2xl mx-auto"
        >
          Exploring the future of multi-cloud architectures, distributed systems, and big data technologies.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <motion.a
            href="/blog"
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27] font-bold rounded-full transition-all duration-300 hover:shadow-lg"
          >
            Read Blog Posts
          </motion.a>
          <motion.a
            href="/about"
            whileHover={{ scale: 1.05, borderColor: '#00d4ff' }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 border-2 border-[#00d4ff]/50 text-[#00d4ff] font-bold rounded-full transition-all duration-300 hover:border-[#00d4ff] hover:shadow-lg hover:shadow-[#00d4ff]/20"
          >
            About Me
          </motion.a>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#00d4ff]"
          >
            <svg
              className="w-6 h-6 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
