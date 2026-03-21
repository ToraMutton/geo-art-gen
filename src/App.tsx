import { GeometricCanvas } from './components/GeometricCanvas';

function App() {
  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-10 px-6 py-3 flex justify-between items-center pointer-events-none">
        <h1 className="text-2xl font-bold tracking-widest text-white">Artora</h1>
        <p className="text-sm text-gray-400">by ToraMutton</p>
      </div>
      <GeometricCanvas />
    </div>
  );
}

export default App;
