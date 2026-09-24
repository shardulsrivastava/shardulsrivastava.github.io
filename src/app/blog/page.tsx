'use client'

import Navigation from '@/components/Navigation'
import BlogCard from '@/components/BlogCard'
import Footer from '@/components/Footer'
import { blogPosts, categories } from '@/data/posts'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05080f] to-[#0a0e27]">
      <Navigation />

      {/* Header */}
      <div className="pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Latest <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Articles</span>
          </h1>
          <p className="text-[#b0bec5] text-lg">
            Insights on cloud architecture, Kubernetes, and data engineering
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Search Box */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 bg-[#0a0e27]/50 border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27]'
                  : 'bg-[#0a0e27]/50 border border-[#00d4ff]/30 text-[#b0bec5] hover:border-[#00d4ff]'
              }`}
            >
              All
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27]'
                    : 'bg-[#0a0e27]/50 border border-[#00d4ff]/30 text-[#b0bec5] hover:border-[#00d4ff]'
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <BlogCard key={post.id} {...post} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-[#b0bec5] text-lg">
                No posts found. Try a different search or category.
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-[#b0bec5]">
            Showing <span className="text-[#00d4ff] font-bold">{filteredPosts.length}</span> of{' '}
            <span className="text-[#ff006e] font-bold">{blogPosts.length}</span> articles
          </p>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
