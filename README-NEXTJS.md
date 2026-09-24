# Shardul's Tech Portfolio - Next.js Edition 🚀

A futuristic, cyberpunk-themed tech portfolio and blog built with **Next.js 14**, **React 18**, **TypeScript**, and **Tailwind CSS**. Features stunning animations, glassmorphic designs, and a modern dark theme with neon accents.

## ✨ Features

- **Futuristic Design**: Cyberpunk aesthetic with neon gradients (cyan, magenta, purple)
- **High Performance**: Built with Next.js 14 for optimal performance and SEO
- **Smooth Animations**: Powered by Framer Motion for delightful interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Type-safe development for better code quality
- **Glassmorphism**: Modern frosted glass effects with backdrop blur
- **Dark Theme**: Eye-friendly dark mode with beautiful color palette
- **Interactive Components**: Hover effects, animations, and dynamic content
- **Blog System**: Blog listing, filtering, and individual post pages
- **Contact Form**: Fully functional contact form template

## 🎨 Design Features

### Color Palette
- **Primary**: `#00d4ff` (Cyan) - Primary accent color
- **Secondary**: `#ff006e` (Magenta) - Secondary accent color
- **Accent**: `#8338ec` (Purple) - Tertiary accent color
- **Dark BG**: `#0a0e27` - Main background
- **Darker BG**: `#05080f` - Darker variant for depth

### Components
- ✨ Animated hero section with mouse tracking effects
- 🎴 Beautiful blog card components with hover effects
- 🧭 Sticky navigation with smooth transitions
- 📧 Email subscription form
- 👨‍💼 About page with experience and skills
- 📚 Blog listing with search and category filtering
- 📞 Contact page with form
- 🔗 Social media links in footer

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Check `.nvmrc` for recommended version)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shardulsrivastava/shardulsrivastava.github.io.git
   cd shardulsrivastava.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── about/
│   │   └── page.tsx            # About page
│   ├── blog/
│   │   ├── page.tsx            # Blog listing page
│   │   └── [id]/
│   │       └── page.tsx        # Individual blog post
│   └── contact/
│       └── page.tsx            # Contact page
├── components/
│   ├── Navigation.tsx          # Top navigation bar
│   ├── Hero.tsx                # Hero section
│   ├── BlogCard.tsx            # Blog post card component
│   └── Footer.tsx              # Footer
├── data/
│   └── posts.ts                # Blog posts data
└── types/
    └── index.ts                # TypeScript type definitions
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **React**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **PostCSS**: For CSS processing

## 📚 Configuration Files

- **next.config.js**: Next.js configuration with image optimization
- **tailwind.config.ts**: Tailwind CSS customization with custom colors and animations
- **postcss.config.js**: PostCSS configuration
- **tsconfig.json**: TypeScript configuration
- **package.json**: Project dependencies and scripts

## 🎯 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 🌐 Pages

### Home Page (`/`)
- Hero section with animated title
- Featured articles showcase
- Recent blog posts grid
- Email subscription CTA

### Blog Page (`/blog`)
- All blog posts grid
- Search functionality
- Category filtering
- Post metadata (date, category, tags)

### Blog Post (`/blog/[id]`)
- Full article view
- Author information
- Related tags
- Back navigation

### About Page (`/about`)
- Personal introduction
- Work experience timeline
- Skills and expertise showcase
- Professional background

### Contact Page (`/contact`)
- Contact form
- Social media links
- Email and location info

## 📝 Blog Content

Blog posts are managed in `src/data/posts.ts`. To add a new post:

```typescript
{
  id: 'unique-slug',
  title: 'Post Title',
  excerpt: 'Short description...',
  date: '2024-09-15',
  category: 'Category Name',
  tags: ['tag1', 'tag2'],
  featured: false, // set to true for featured posts
}
```

## 🎨 Customization

### Colors
Edit the CSS variables in `tailwind.config.ts` under the `extend.colors` section.

### Fonts
Currently using **Inter** from Google Fonts. Change in `src/app/layout.tsx`.

### Animations
Customize animations in `tailwind.config.ts` under `extend.keyframes`.

### Content
Update author info in `src/data/posts.ts` and component files.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build
```

### Other Platforms
Next.js can be deployed to any Node.js hosting platform.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔧 Performance Optimizations

- ✅ Image optimization with Next.js Image component
- ✅ Code splitting and lazy loading
- ✅ CSS-in-JS with Tailwind for minimal CSS
- ✅ Font optimization with next/font
- ✅ Viewport-based animation triggering with Framer Motion

## 🐛 Known Issues & Improvements

- Blog content is currently mock data. Integrate with CMS for real content
- Contact form doesn't send emails. Add email service integration (Nodemailer, SendGrid, etc.)
- More detailed blog post pages with markdown support
- Search functionality optimization

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📬 Contact

- **Email**: shardul.srivastava007@gmail.com
- **Twitter**: [@shardulsrvstv](https://twitter.com/shardulsrvstv)
- **GitHub**: [shardulsrivastava](https://github.com/shardulsrivastava)
- **LinkedIn**: [shardulsrivastava](https://linkedin.com/in/shardulsrivastava)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for utility-first CSS
- Framer Motion for smooth animations
- All open-source contributors

---

Built with ❤️ using Next.js & Tailwind CSS
