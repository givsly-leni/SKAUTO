import './App.css'
import ConnectionStatus from './components/ConnectionStatus'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>SKAUTO</h1>
        <p>Starter app — connected to Netlify + Supabase</p>
        <ConnectionStatus />
      </header>
dsddddddddddddddddddddddddddddddddddddddddddddddddddd
      <section className="card">
        <h2>You're set up</h2>
        <p>
          This is a TypeScript + React (Vite) PWA. It installs on iPhone via
          Add to Home Screen, and works as a normal site on laptop. Edit{' '}
          <code>src/App.tsx</code> to start building the real app.
        </p>
      </section>

      <section className="card">
        <h2>Next steps</h2>
        <p>
          1) Add your Supabase URL/key to <code>.env</code>. 2) Push to
          GitHub. 3) Connect the repo on Netlify for automatic deploys. See
          README.md for details.
        </p>
      </section>
    </div>
  )
}

export default App
