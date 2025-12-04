export {};
declare global {
  interface Window {
    hubbi: {
      register: (id: string, component: any) => void;
      db: any;
      navigate: any;
      notify: (msg: string) => void;
    };
  }
}