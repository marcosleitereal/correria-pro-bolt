import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error boundary para capturar erros em produção
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error boundary caught:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <h1 style={{ color: '#1e40af', marginBottom: '1rem' }}>Correria.Pro</h1>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            Ops! Algo deu errado. Tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#1e40af',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback rendering
  document.getElementById('root')!.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; text-align: center; padding: 2rem;">
      <div>
        <h1 style="color: #1e40af; margin-bottom: 1rem;">Correria.Pro</h1>
        <p style="color: #64748b; margin-bottom: 1rem;">Erro ao carregar a aplicação</p>
        <button onclick="window.location.reload()" style="background: #1e40af; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;">
          Recarregar Página
        </button>
      </div>
    </div>
  `;
}