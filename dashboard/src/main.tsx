import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { AuthProvider, useConvexAuth } from './components/AuthContext'
import App from './App'
import './index.css'

const CONVEX_URL = (import.meta as any).env?.VITE_CONVEX_URL

if (!CONVEX_URL) {
  throw new Error('Missing VITE_CONVEX_URL')
}

const convex = new ConvexReactClient(CONVEX_URL)

function ConvexAuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider convex={convex}>
      <ConvexAuthWrapper>
        <App />
      </ConvexAuthWrapper>
    </AuthProvider>
  </React.StrictMode>,
)
