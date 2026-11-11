import { lazy, Suspense, useCallback, useState } from 'react'
import SmoothScroll from './components/SmoothScroll'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Preloader from './components/Preloader'
import Hero from './sections/Hero'
import About from './sections/About'
import Experience from './sections/Experience'
import Skills from './sections/Skills'
import Contact from './sections/Contact'
import Footer from './components/Footer'
import StoryRail from './components/StoryRail'
import SectionTransitions from './components/SectionTransitions'
import Companion from './components/Companion'
import CommandPalette from './components/CommandPalette'
import ParticleStream from './components/ParticleStream'
import LiveCursors from './components/LiveCursors'
import StoryParticles from './components/StoryParticles'

// Projects pulls in the device mockup and modal; keep it out of the first chunk.
const Projects = lazy(() => import('./sections/Projects'))

export default function App() {
  const [ready, setReady] = useState(false)
  const onPreloaderDone = useCallback(() => setReady(true), [])
  const [footerH, setFooterH] = useState(0)
  const onFooterHeight = useCallback((h: number) => setFooterH(h), [])

  return (
    <SmoothScroll paused={!ready}>
      <Preloader onDone={onPreloaderDone} />
      <Cursor />
      <Nav />
      <StoryRail />
      <SectionTransitions />
      {ready && <Companion />}
      <CommandPalette />
      {/* One set of grains: name in the hero -> dust -> face in About */}
      <StoryParticles ready={ready} />
      {ready && <ParticleStream />}
      {ready && <LiveCursors />}
      {/* main sits above the fixed footer and leaves room for it: the curtain */}
      <main id="content" className="relative z-10 bg-sage shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]" style={{ marginBottom: footerH }}>
        <Hero ready={ready} />
        <About />
        <Experience />
        <Skills />
        <Suspense fallback={<div className="min-h-screen bg-ink" aria-hidden />}>
          <Projects />
        </Suspense>
        <Contact />
      </main>
      <Footer onHeight={onFooterHeight} />
    </SmoothScroll>
  )
}
