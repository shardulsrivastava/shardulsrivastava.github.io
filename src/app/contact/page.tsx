'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'

export default function Contact() {
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
            Get in <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-[#b0bec5] text-lg">
            Have a project in mind? Let's connect and build something amazing.
          </p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Contact Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-2xl p-8 sm:p-12"
        >
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-[#00d4ff] font-semibold mb-2">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 bg-[#05080f] border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[#00d4ff] font-semibold mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-[#05080f] border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-[#00d4ff] font-semibold mb-2">Subject</label>
              <input
                type="text"
                placeholder="What's this about?"
                className="w-full px-4 py-3 bg-[#05080f] border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300"
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-[#00d4ff] font-semibold mb-2">Message</label>
              <textarea
                placeholder="Your message here..."
                rows={6}
                className="w-full px-4 py-3 bg-[#05080f] border border-[#00d4ff]/30 rounded-lg text-white placeholder-[#b0bec5] focus:outline-none focus:border-[#00d4ff] transition-colors duration-300 resize-none"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#8338ec] text-[#0a0e27] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00d4ff]/30 transition-all duration-300"
            >
              Send Message
            </motion.button>
          </div>
        </motion.form>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12"
        >
          <div className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-lg p-6">
            <h3 className="text-[#00d4ff] font-bold mb-2">Email</h3>
            <p className="text-[#b0bec5]">shardul.srivastava007@gmail.com</p>
          </div>
          <div className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-lg p-6">
            <h3 className="text-[#00d4ff] font-bold mb-2">Location</h3>
            <p className="text-[#b0bec5]">India</p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
