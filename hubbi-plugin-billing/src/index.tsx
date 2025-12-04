import App from './App';

const PLUGIN_ID = "com.hubbi.billing";

// Función de registro segura
const registerPlugin = () => {
  if (window.hubbi) {
    window.hubbi.register(PLUGIN_ID, App);
    console.log(`[${PLUGIN_ID}] Registrado exitosamente.`);
  } else {
    console.warn(`[${PLUGIN_ID}] Hubbi SDK no encontrado. Reintentando...`);
    setTimeout(registerPlugin, 500);
  }
};

registerPlugin();

// Exportamos el componente por si acaso
export default App;