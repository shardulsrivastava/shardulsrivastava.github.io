export const blogPosts = [
  {
    id: 'kubernetes-cka-guide',
    title: 'Complete Guide to Kubernetes CKA Certification',
    excerpt:
      'Master Kubernetes administration with this comprehensive guide covering cluster setup, networking, storage, and security best practices.',
    date: '2024-09-15',
    category: 'Kubernetes',
    tags: ['kubernetes', 'cka', 'certification', 'devops'],
    featured: true,
  },
  {
    id: 'multi-cloud-strategy',
    title: 'Building a Multi-Cloud Strategy',
    excerpt:
      'Explore best practices for managing workloads across AWS, GCP, and Azure while maintaining consistency and reducing vendor lock-in.',
    date: '2024-09-10',
    category: 'Cloud Architecture',
    tags: ['aws', 'gcp', 'azure', 'multi-cloud'],
    featured: true,
  },
  {
    id: 'data-pipeline-optimization',
    title: 'Optimizing Data Pipelines for Big Data',
    excerpt:
      'Learn techniques to optimize Apache Spark, Kafka, and distributed data processing systems for better performance and cost efficiency.',
    date: '2024-09-05',
    category: 'Data Engineering',
    tags: ['spark', 'kafka', 'data-pipeline', 'optimization'],
    featured: false,
  },
  {
    id: 'terraform-infrastructure',
    title: 'Infrastructure as Code with Terraform',
    excerpt:
      'Deep dive into Terraform best practices, modules, state management, and creating reusable infrastructure patterns.',
    date: '2024-08-28',
    category: 'Infrastructure',
    tags: ['terraform', 'iac', 'infrastructure', 'automation'],
    featured: false,
  },
  {
    id: 'observability-monitoring',
    title: 'Observability Stack: Logs, Metrics, and Traces',
    excerpt:
      'Building a comprehensive observability system with Prometheus, Grafana, ELK Stack, and distributed tracing.',
    date: '2024-08-20',
    category: 'DevOps',
    tags: ['observability', 'prometheus', 'grafana', 'tracing'],
    featured: false,
  },
  {
    id: 'system-design-microservices',
    title: 'System Design: Building Scalable Microservices',
    excerpt:
      'Design patterns, trade-offs, and practical strategies for building scalable, resilient microservice architectures.',
    date: '2024-08-15',
    category: 'Architecture',
    tags: ['microservices', 'system-design', 'scalability', 'resilience'],
    featured: false,
  },
]

export const categories = [
  { name: 'Kubernetes', count: 12 },
  { name: 'Cloud Architecture', count: 8 },
  { name: 'Data Engineering', count: 10 },
  { name: 'Infrastructure', count: 15 },
  { name: 'DevOps', count: 9 },
  { name: 'Architecture', count: 7 },
]

export const technologies = [
  { name: 'Kubernetes', icon: '☸️' },
  { name: 'AWS', icon: '☁️' },
  { name: 'GCP', icon: '☁️' },
  { name: 'Terraform', icon: '🏗️' },
  { name: 'Spark', icon: '⚡' },
  { name: 'Kafka', icon: '📨' },
  { name: 'Docker', icon: '🐳' },
  { name: 'Prometheus', icon: '📊' },
]
