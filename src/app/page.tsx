'use client'

import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import BlogCard from '@/components/BlogCard'
import Footer from '@/components/Footer'
import { blogPosts } from '@/data/posts'
import { motion } from 'framer-motion'

export default function Home() {
  const featuredPosts = blogPosts.filter((post) => post.featured)
  const recentPosts = blogPosts.slice(0, 6)

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05080f] to-[#0a0e27] relative">
      <Navigation />

      {/* Hero Section */}
      <Hero />

      {/* Featured Posts Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Featured <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Articles</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-[#00d4ff] to-[#ff006e] mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {featuredPosts.map((post) => (
            <BlogCard key={post.id} {...post} />
          ))}
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Recent <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Posts</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-[#00d4ff] to-[#ff006e] mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recentPosts.map((post) => (
            <BlogCard key={post.id} {...post} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.a
            href="/blog"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-3 border-2 border-[#00d4ff] text-[#00d4ff] font-bold rounded-full hover:bg-[#00d4ff]/10 transition-all duration-300"
          >
            View All Posts →
          </motion.a>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-[#00d4ff]/30 bg-gradient-to-r from-[#00d4ff]/5 to-[#ff006e]/5 p-12 text-center overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#ff006e] filter blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stay Updated with Latest Content
            </h3>
            <p className="text-[#b0bec5] mb-8 text-lg">
              Subscribe to get notified about new blog posts, tutorials, and technical insights.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-[#0a0e27]/50 border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00d4ff]/30 transition-all duration-300"
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
