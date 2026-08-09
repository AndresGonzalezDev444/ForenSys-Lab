import { MainLayout } from './components/layout/MainLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();
  return <MainLayout />;
}

export default App;