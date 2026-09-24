'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'

export default function About() {
  const skills = [
    {
      category: 'Cloud Platforms',
      items: ['AWS', 'Google Cloud', 'Azure', 'Multi-Cloud Architecture'],
    },
    {
      category: 'Container & Orchestration',
      items: ['Kubernetes', 'Docker', 'Docker Swarm', 'Container Security'],
    },
    {
      category: 'Data Technologies',
      items: ['Apache Spark', 'Apache Kafka', 'Data Pipelines', 'Big Data'],
    },
    {
      category: 'Infrastructure & DevOps',
      items: ['Terraform', 'CI/CD', 'Infrastructure as Code', 'GitOps'],
    },
    {
      category: 'Observability',
      items: ['Prometheus', 'Grafana', 'ELK Stack', 'Distributed Tracing'],
    },
    {
      category: 'Programming',
      items: ['Python', 'Go', 'Bash', 'SQL'],
    },
  ]

  const experience = [
    {
      role: 'Senior Cloud Engineer',
      company: 'Tech Company XYZ',
      duration: '2022 - Present',
      description:
        'Leading cloud infrastructure initiatives, designing multi-cloud architectures, and mentoring engineering teams.',
    },
    {
      role: 'Cloud Infrastructure Specialist',
      company: 'Cloud Solutions Inc',
      duration: '2020 - 2022',
      description:
        'Architected and deployed Kubernetes clusters, implemented CI/CD pipelines, and managed cloud cost optimization.',
    },
    {
      role: 'DevOps Engineer',
      company: 'Startup ABC',
      duration: '2018 - 2020',
      description:
        'Built and maintained infrastructure, implemented observability solutions, and automated deployment processes.',
    },
  ]

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
            About <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Me</span>
          </h1>
          <p className="text-[#b0bec5] text-lg">
            Cloud architect, data engineer, and open-source enthusiast
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-2xl p-8 sm:p-12">
            <p className="text-[#b0bec5] text-lg leading-relaxed mb-4">
              I'm Shardul Srivastava, a passionate cloud engineer and data enthusiast with over 6 years of experience
              building scalable, resilient systems on multi-cloud platforms.
            </p>
            <p className="text-[#b0bec5] text-lg leading-relaxed mb-4">
              My expertise spans across Kubernetes orchestration, cloud infrastructure design, and big data processing.
              I'm deeply interested in system design, DevOps practices, and building solutions that solve real-world
              problems at scale.
            </p>
            <p className="text-[#b0bec5] text-lg leading-relaxed">
              When I'm not working on infrastructure challenges, you can find me writing technical blogs, exploring new
              technologies, or contributing to open-source projects.
            </p>
          </div>
        </motion.section>

        {/* Experience */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Experience</span>
          </h2>

          <div className="space-y-6">
            {experience.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-lg p-6 hover:border-[#00d4ff]/60 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#00d4ff]">{item.role}</h3>
                    <p className="text-[#ff006e]">{item.company}</p>
                  </div>
                  <span className="text-[#b0bec5] text-sm">{item.duration}</span>
                </div>
                <p className="text-[#b0bec5]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Skills */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#ff006e] bg-clip-text text-transparent">Skills & Expertise</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#0a0e27]/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-lg p-6 hover:border-[#00d4ff]/60 transition-all duration-300 group"
              >
                <h3 className="text-lg font-bold text-[#00d4ff] mb-4 group-hover:text-[#ff006e] transition-colors">
                  {skill.category}
                </h3>
                <ul className="space-y-2">
                  {skill.items.map((item, i) => (
                    <li key={i} className="text-[#b0bec5] flex items-center">
                      <span className="mr-2 text-[#00d4ff]">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      <Footer />
    </main>
  )
}
