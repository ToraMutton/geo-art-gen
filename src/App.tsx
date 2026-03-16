import { GeometricCanvas } from './components/GeometricCanvas';

function App() {
  return (
    <div style={{ color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ pointerEvents: 'none' }}>Geo Art Gen</h1>
      <p style={{ pointerEvents: 'none' }}>by ToraMutton</p>

      <GeometricCanvas />
    </div>
  );
}

export default App;
