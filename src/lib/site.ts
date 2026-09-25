export const site = {
  name: "Shardul Srivastava",
  handle: "shardul.dev",
  url: "https://shardul.dev",
  title: "Shardul Srivastava — Cloud & Platform Engineering",
  description:
    "Engineering leader working on Kubernetes, AWS and data platforms. Deep dives on EKS, Istio, Karpenter and the infrastructure underneath.",
  role: "Engineering Leader · Cloud & Data Platforms",
  bio: "AWS Community Builder and CNCF enthusiast. I build and lead teams around Kubernetes, multi-cloud infrastructure and large-scale data platforms — and write up the parts that took me too long to figure out.",
  gaId: "G-PNEQ8HXLQ6",
  avatar: "/assets/images/shardul.jpeg",
  social: {
    github: "https://github.com/shardulsrivastava",
    twitter: "https://twitter.com/shardulsrvstv",
    devto: "https://dev.to/shardulsrivastava",
    linkedin: "https://www.linkedin.com/in/shardulsrivastava",
    email: "mailto:shardul.srivastava007@gmail.com",
  },
} as const;

export const nav = [
  { href: "/", label: "index" },
  { href: "/blog/", label: "writing" },
  { href: "/tags/", label: "topics" },
  { href: "/about/", label: "about" },
];
