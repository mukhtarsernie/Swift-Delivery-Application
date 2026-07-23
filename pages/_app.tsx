import type { AppProps } from 'next/app';
import { AuthProvider } from '../components/AuthContext';
import { Component } from 'react';
import '../styles/globals.css';

class GlobalErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('Global error:', error); }
  render() {
    if (this.state.hasError) {
      return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'sans-serif' }}><div style={{ textAlign:'center',padding:40 }}><h2 style={{ color:'#ef4444',marginBottom:8 }}>Something went wrong</h2><p style={{ color:'#64748b',fontSize:14,marginBottom:16 }}>Please refresh the page to try again.</p><button onClick={()=>{this.setState({hasError:false});window.location.reload();}} style={{ background:'#6366f1',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer' }}>Refresh Page</button></div></div>;
    }
    return this.props.children;
  }
}

export default function App({ Component: PageComponent, pageProps }: AppProps) {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <PageComponent {...pageProps} />
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
