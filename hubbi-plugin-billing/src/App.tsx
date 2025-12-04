import { useState } from 'react';
import { Receipt, Plus } from 'lucide-react';

// Nota: En este proyecto NO importamos dbService de Hubbi directamente.
// Usamos window.hubbi.db

function App() {
  const [loading, setLoading] = useState(false);

  const testDb = async () => {
    setLoading(true);
    try {
      // Usamos el puente del SDK
      window.hubbi.notify("Consultando DB desde Plugin Externo...");
      
      // Simulamos query
      // const res = await window.hubbi.db.query("SELECT * FROM users");
      // console.log(res);
      
      setTimeout(() => setLoading(false), 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full bg-white/5 rounded-2xl border border-white/10 text-white animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
          <Receipt size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Módulo de Facturación</h1>
          <p className="text-white/50">Versión Externa 1.0 (Compilada independientemente)</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="p-6 bg-black/20 rounded-xl border border-white/5">
          <h2 className="font-bold mb-2">Estado del Plugin</h2>
          <p className="text-sm text-white/70">
            Este componente ha sido compilado desde el proyecto <code>hubbi-plugin-billing</code> 
            y cargado dinámicamente en el núcleo de Hubbi.
          </p>
        </div>

        <button 
          onClick={testDb}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Procesando..." : <><Plus size={20} /> Crear Factura de Prueba</>}
        </button>
      </div>
    </div>
  );
}

export default App;