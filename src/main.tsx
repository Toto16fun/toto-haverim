import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 [MAIN] Application is starting...');
console.log('🚀 [MAIN] Current URL:', window.location.href);

createRoot(document.getElementById("root")!).render(<App />);
