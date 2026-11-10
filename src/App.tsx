import { lazy, Suspense, useState } from 'react'
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

// Projects pulls in the device mockup and modal; keep it out of the first chunk.
const Projects = lazy(() => import('./sections/Projects'))

export default function App() {
  const [ready, setReady] = useState(false)

  return (
    <SmoothScroll paused={!ready}>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <Nav />
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
