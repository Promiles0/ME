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

// Projects pulls in the device mockup and modal; keep it out of the first chunk.
const Projects = lazy(() => import('./sections/Projects'))

export default function App() {
  const [ready, setReady] = useState(false)
  const onPreloaderDone = useCallback(() => setReady(true), [])

  return (
    <SmoothScroll paused={!ready}>
      <Preloader onDone={onPreloaderDone} />
      <Cursor />
      <Nav />
      <StoryRail />
      <SectionTransitions />
      <main id="content">
        <Hero ready={ready} />
        <About />
        <Experience />
        <Skills />
        <Suspense fallback={<div className="min-h-screen bg-ink" aria-hidden />}>
          <Projects />
        </Suspense>
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  )
}
