'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { blogPosts } from '@/data/posts'
import { motion } from 'framer-motion'

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find((p) => p.id === params.id)

  if (!post) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#05080f] to-[#0a0e27]">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <h1 className="text-4xl font-bold text-[#00d4ff]">Post not found</h1>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05080f] to-[#0a0e27]">
      <Navigation />

      {/* Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Category Badge */}
          <div className="flex items-center gap-4 mb-6">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27] text-sm font-bold rounded-full">
              {post.category}
            </span>
            <span className="text-[#b0bec5]">{post.date}</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            {post.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30"
              >
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          <div className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-2xl p-8 sm:p-12">
            <p className="text-[#b0bec5] text-lg leading-relaxed mb-6">{post.excerpt}</p>

            <div className="space-y-6 text-[#b0bec5] leading-relaxed">
              <p>
                This is a sample blog post content. In a production environment, this would be populated with the full markdown content of your blog posts.
                The actual implementation would typically fetch content from a CMS, markdown files, or a database.
              </p>

              <h2 className="text-2xl font-bold text-[#00d4ff] mt-8">Key Takeaways</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Point 1: Lorem ipsum dolor sit amet</li>
                <li>Point 2: Consectetur adipiscing elit</li>
                <li>Point 3: Sed do eiusmod tempor incididunt</li>
                <li>Point 4: Ut labore et dolore magna aliqua</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#00d4ff] mt-8">Getting Started</h2>
              <p>
                This section would contain practical examples and code snippets relevant to the blog post topic.
                You can add code blocks, diagrams, and interactive elements here.
              </p>

              <h2 className="text-2xl font-bold text-[#00d4ff] mt-8">Conclusion</h2>
              <p>
                A meaningful conclusion that summarizes the key points and provides actionable insights for readers.
              </p>
            </div>

            {/* Author Info */}
            <div className="mt-12 pt-8 border-t border-[#00d4ff]/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00d4ff] to-[#ff006e]"></div>
                <div>
                  <h3 className="font-bold text-white">Shardul Srivastava</h3>
                  <p className="text-[#b0bec5]">Cloud Engineer & Data Enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </article>

      <Footer />
    </main>
  )
}
