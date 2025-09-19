import { WindowContextProvider, menuItems } from '@/app/components/window'
import appIcon from '@/resources/build/icon.png'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './app'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WindowContextProvider titlebar={{ title: 'Griffin Atm Dashboard', icon: appIcon, menuItems }}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#272727', // کمی روشن‌تر از پس‌زمینه اصلی
              color: '#fff',
              border: '1px solid #444',
            },
          }}
        />
      </WindowContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
