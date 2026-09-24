'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://twitter.com/shardulsrvstv',
      icon: 'twitter',
    },
    {
      name: 'GitHub',
      url: 'https://github.com/shardulsrivastava',
      icon: 'github',
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/shardulsrivastava',
      icon: 'linkedin',
    },
    {
      name: 'Email',
      url: 'mailto:shardul.srivastava007@gmail.com',
      icon: 'email',
    },
  ]

  const footerLinks = [
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Projects', href: '/projects' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
  ]

  return (
    <footer className="relative bg-gradient-to-t from-[#05080f] to-[#0a0e27] border-t border-[#00d4ff]/10 mt-20 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent mb-3">
              Shardul
            </h3>
            <p className="text-[#b0bec5] leading-relaxed">
              Cloud architect and data engineer exploring the future of distributed systems.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-[#00d4ff] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#b0bec5] hover:text-[#00d4ff] transition-colors duration-300"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-[#00d4ff] mb-4">Connect</h4>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="w-10 h-10 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] hover:bg-[#00d4ff]/20 hover:border-[#00d4ff] transition-all duration-300"
                  title={link.name}
                >
                  {link.icon === 'twitter' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  )}
                  {link.icon === 'github' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.375.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {link.icon === 'linkedin' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.337 2H3.663A1.66 1.66 0 002 3.663v12.674A1.66 1.66 0 003.663 18h12.674A1.66 1.66 0 0018 16.337V3.663A1.66 1.66 0 0016.337 2zM6.5 15h-2.5v-8h2.5v8zm-1.25-9.25a1.45 1.45 0 110-2.9 1.45 1.45 0 010 2.9zM15 15h-2.5v-4c0-.97-.36-1.63-1.21-1.63-.66 0-1.05.44-1.22.89-.06.14-.08.34-.08.54v4.2h-2.5v-8h2.5v1.09c.34-.52.94-1.27 2.29-1.27 1.67 0 2.92 1.09 2.92 3.44V15z" />
                    </svg>
                  )}
                  {link.icon === 'email' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#00d4ff]/10 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-[#b0bec5] text-sm">
            © {currentYear} Shardul Srivastava. All rights reserved.
          </p>
          <p className="text-[#b0bec5] text-sm mt-4 sm:mt-0">
            Built with <span className="text-[#ff006e]">❤️</span> using Next.js & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
