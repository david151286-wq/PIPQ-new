/* ==================================================================
   CONFIGURAÇÃO DO FIREBASE
   ------------------------------------------------------------------
   Cole aqui as chaves que o Firebase te dá quando você cria o
   projeto (Configurações do projeto → Geral → "Seus apps" → ícone
   </> → Configuração do SDK).

   Enquanto os campos abaixo continuarem com "SUA_..." (valores de
   exemplo), o site funciona normalmente, mas:
   - o calendário e as sociedades mostram só o conteúdo de exemplo
   - a edição (login de admin) fica desativada

   Depois de colar as chaves reais e publicar o site de novo, tudo
   passa a ler e gravar direto no seu banco de dados na nuvem.
   ================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBSR7_HprEJVLkl6jnyQ7Q5dkfFn39E-Ic",
  authDomain: "pipq--app.firebaseapp.com",
  projectId: "pipq--app",
  storageBucket: "pipq--app.firebasestorage.app",
  messagingSenderId: "202022101829",
  appId: "1:202022101829:web:f5aec672193908f63e942c"
};

// Detecta automaticamente se as chaves ainda são as de exemplo
const FIREBASE_CONFIGURADO = !Object.values(firebaseConfig).some(v => String(v).startsWith('SUA_') || String(v).startsWith('SEU_'));

export { firebaseConfig, FIREBASE_CONFIGURADO };
