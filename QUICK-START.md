# ⚡ Quick Start Guide

## Your Next.js Portfolio is Ready! 🚀

### Step 1: Install Dependencies (2 minutes)
```bash
cd ~/Desktop/Shardul/Technical/shardulsrivastava.github.io
npm install
```

### Step 2: Run Development Server (30 seconds)
```bash
npm run dev
```

### Step 3: View Your Website
Open browser → **http://localhost:3000** 

---

## 🎨 What You Get

### Stunning Features ✨
- **Futuristic Cyberpunk Design** - Cyan/Magenta/Purple neon theme
- **Smooth Animations** - Powered by Framer Motion
- **Interactive Components** - Hover effects, mouse tracking, glassmorphism
- **Responsive Design** - Looks great on all devices
- **Type-Safe Code** - Built with TypeScript

### Pages Included 📄
1. **Home** - Hero section + Featured articles + Recent posts
2. **Blog** - List all posts with search & filtering
3. **Blog Post** - Individual article pages
4. **About** - About you with skills & experience
5. **Contact** - Contact form template

### Components Built 🧩
- Navigation bar (sticky, animated)
- Hero section (mouse tracking effects)
- Blog cards (shimmer effects, hover animations)
- Footer (social links, quick links)
- Forms (email subscription, contact)

---

## 🎯 Immediate Customization

### 1. Change Your Name/Info
Edit `src/data/posts.ts`:
```typescript
authors:
  shardul:
    name: "Your Name"
    email: "your@email.com"
    web: "your-website.com"
```

### 2. Update Blog Posts
Edit `src/data/posts.ts` - Add/remove blog posts:
```typescript
{
  id: 'my-first-post',
  title: 'My First Post',
  excerpt: 'Post description...',
  date: '2024-09-24',
  category: 'Tech',
  tags: ['tag1', 'tag2'],
  featured: true,
}
```

### 3. Customize Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: '#your-color',
  secondary: '#your-color',
}
```

---

## 📁 Key Files to Know

```
src/
├── app/
│   ├── page.tsx          ← Home page
│   ├── about/page.tsx    ← About page
│   ├── blog/page.tsx     ← Blog listing
│   ├── contact/page.tsx  ← Contact page
│   └── globals.css       ← Global styles
├── components/
│   ├── Navigation.tsx    ← Top nav bar
│   ├── Hero.tsx          ← Hero section
│   ├── BlogCard.tsx      ← Blog cards
│   └── Footer.tsx        ← Footer
└── data/
    └── posts.ts          ← Blog posts data
```

---

## 🚀 Common Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## 📦 Deployment (3 minutes)

### Option 1: Vercel (Easiest)
```bash
npm install -g vercel
vercel
# Follow prompts to connect GitHub and deploy
```

### Option 2: GitHub Pages
```bash
npm run build
# Deploy from 'out' folder
```

---

## 🎨 Design Highlights

### Color Palette
- Cyan: `#00d4ff` - Main accent
- Magenta: `#ff006e` - Secondary
- Purple: `#8338ec` - Tertiary
- Dark: `#0a0e27` - Background

### Effects & Animations
- ✨ Gradient text animations
- 🌊 Glassmorphic cards
- 🖱️ Mouse tracking hero
- 🔆 Neon glow effects
- 🎭 Smooth page transitions

---

## 🔧 Technology Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

---

## 📚 Next Steps

1. ✅ Run `npm install && npm run dev`
2. ✅ Open http://localhost:3000
3. ✅ Customize content in `src/data/posts.ts`
4. ✅ Update colors and fonts as needed
5. ✅ Deploy to Vercel or GitHub Pages

---

## 💡 Pro Tips

1. **Hot Reload** - Changes auto-refresh in browser
2. **Type Safety** - TypeScript catches errors early
3. **Tailwind Classes** - Use VSCode extension for auto-complete
4. **SEO** - Next.js handles metadata automatically
5. **Performance** - Optimized out of the box

---

## 🆘 Troubleshooting

### Port 3000 Already In Use
```bash
npm run dev -- -p 3001
```

### Clear Cache
```bash
rm -rf .next
npm run dev
```

### Update Dependencies
```bash
npm update
```

---

## 📚 Documentation Files

- `README-NEXTJS.md` - Full documentation
- `TRANSFORMATION-SUMMARY.md` - What changed
- `QUICK-START.md` - This file

---

**Ready to go? Run `npm install && npm run dev` now!** 🚀

Built with ❤️ using Next.js + Tailwind CSS + Framer Motion
