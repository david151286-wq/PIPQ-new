

import { firebaseConfig, FIREBASE_CONFIGURADO } from './firebase-config.js';

let app = null, db = null, auth = null;
let firebaseModules = null;
let erroConexao = null;

async function initFirebase() {
  if (!FIREBASE_CONFIGURADO) return false;
  if (app) return true;
  try {
    const [appMod, firestoreMod, authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js')
    ]);
    firebaseModules = { ...appMod, ...firestoreMod, ...authMod };
    app = firebaseModules.initializeApp(firebaseConfig);
    db = firebaseModules.getFirestore(app);
    auth = firebaseModules.getAuth(app);
    return true;
  } catch (err) {
    console.warn('Não foi possível conectar ao Firebase — usando dados de exemplo.', err);
    erroConexao = err;
    return false;
  }
}

function mensagemFalhaFirebase() {
  if (!FIREBASE_CONFIGURADO) return 'Firebase não configurado. Configure as chaves em firebase-config.js para ativar a edição.';
  return 'Não foi possível conectar ao banco de dados. Verifique sua internet e tente novamente.';
}

/* ==================================================================
   DADOS DE EXEMPLO — usados quando o Firebase ainda não está
   configurado, ou enquanto a página carrega os dados reais.
   ================================================================== */
const EXEMPLO_EVENTOS = [
  { id: 'ex1', data: new Date().toISOString().slice(0, 10), titulo: 'Culto da manhã', hora: '10:30', descricao: 'Pregação e Santa Ceia' },
];

const EXEMPLO_HORARIOS = [
  { id: 'h1', dia: 'Domingo', titulo: 'Escola Bíblica Dominical', descricao: 'Estudo da Palavra para todas as idades', hora: '09h00', ordem: 1 },
  { id: 'h2', dia: 'Domingo', titulo: 'Culto da manhã', descricao: 'Pregação e Santa Ceia (1º domingo do mês)', hora: '10h30', ordem: 2 },
  { id: 'h3', dia: 'Domingo', titulo: 'Culto da noite', descricao: 'Louvor e pregação', hora: '18h30', ordem: 3 },
  { id: 'h4', dia: 'Quarta', titulo: 'Reunião de oração', descricao: 'Encontro de oração e estudo', hora: '19h30', ordem: 4 },
];

const SOCIEDADES_INFO = {
  ucp: { nome: 'UCP', extenso: 'União de Crianças Presbiterianas', publico: 'Crianças', descricao: 'Ensina as crianças da igreja sobre a fé cristã de um jeito leve e divertido, com música, brincadeiras e a Palavra de Deus.', encontro: 'Domingos, durante a Escola Bíblica Dominical', lideranca: 'A definir' },
  upa: { nome: 'UPA', extenso: 'União Presbiteriana de Adolescentes', publico: 'Adolescentes', descricao: 'Acompanha os adolescentes da igreja num momento da vida cheio de perguntas, ajudando-os a crescer na fé e na amizade umas com os outros.', encontro: 'A definir', lideranca: 'A definir' },
  ump: { nome: 'UMP', extenso: 'União de Mocidade Presbiteriana', publico: 'Jovens', descricao: 'Reúne os jovens da igreja para comunhão, estudo bíblico e serviço, vivendo a fé junto nessa fase da vida.', encontro: 'A definir', lideranca: 'A definir' },
  uph: { nome: 'UPH', extenso: 'União Presbiteriana de Homens', publico: 'Homens', descricao: 'Une os homens da igreja em torno da Palavra, da oração e do companheirismo, fortalecendo sua caminhada como líderes de fé em casa e na igreja.', encontro: 'A definir', lideranca: 'A definir' },
  saf: { nome: 'SAF', extenso: 'Sociedade Auxiliadora Feminina', publico: 'Mulheres', descricao: 'Reúne as mulheres da igreja para comunhão, estudo da Palavra e ações sociais, servindo à igreja e à comunidade.', encontro: 'A definir', lideranca: 'A definir' },
};

const EXEMPLO_AGENDA_SOCIEDADE = {
  ucp: [], upa: [], ump: [], uph: [], saf: [],
};

const EXEMPLO_SOBRE = {
  quemSomos: 'A Primeira Igreja Presbiteriana em Queimados é uma comunidade de fé reformada, comprometida com a pregação fiel da Palavra de Deus, a vida em comunhão e o serviço ao próximo. Seguimos a tradição presbiteriana e reformada, com seu governo por presbíteros e sua confissão histórica de fé. Acreditamos que a igreja existe para adorar a Deus, edificar os seus membros e anunciar o evangelho de Jesus Cristo a todas as pessoas.',
  noQueCremos: 'Como igreja reformada, cremos nas Escrituras Sagradas como a Palavra inspirada por Deus e a única regra infalível de fé e prática (Sola Scriptura). Cremos em um só Deus, eternamente existente em três pessoas: Pai, Filho e Espírito Santo. Cremos que a salvação é unicamente pela graça de Deus, mediante a fé em Jesus Cristo, que morreu e ressuscitou para o perdão dos nossos pecados — e que tudo isso é, do início ao fim, obra da graça soberana de Deus.',
};

const EXEMPLO_TEMAS_ESTUDO = [];
const EXEMPLO_TEMAS_ORACAO = [];

const EXEMPLO_PIPQTV = {
  youtube: 'https://www.youtube.com/@igrejaqueimados',
  instagram: 'https://www.instagram.com/igrejaqueimados',
};

/* ==================================================================
   LOGIN DE ADMINISTRADOR
   ================================================================== */
async function login(email, senha) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { signInWithEmailAndPassword } = firebaseModules;
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

async function logout() {
  if (!auth) return;
  const { signOut } = firebaseModules;
  await signOut(auth);
}

function onAuthChange(callback) {
  initFirebase().then(ok => {
    if (!ok) { callback(null); return; }
    const { onAuthStateChanged } = firebaseModules;
    onAuthStateChanged(auth, user => callback(user));
  });
}

/* ==================================================================
   EVENTOS DO CALENDÁRIO
   Documento em Firestore: coleção "eventos"
   Campos: data ("AAAA-MM-DD"), titulo, hora ("HH:MM"), descricao
   ================================================================== */
async function getEventos() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_EVENTOS;
  try {
    const { collection, getDocs, query, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'eventos'), orderBy('data')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Erro ao buscar eventos, usando exemplo.', err);
    return EXEMPLO_EVENTOS;
  }
}

async function salvarEvento(evento) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  if (evento.id) {
    const ref = doc(db, 'eventos', evento.id);
    const { id, ...resto } = evento;
    await setDoc(ref, resto);
    return evento.id;
  } else {
    const ref = await addDoc(collection(db, 'eventos'), evento);
    return ref.id;
  }
}

async function excluirEvento(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'eventos', id));
}

/* ==================================================================
   HORÁRIOS FIXOS DE CULTO
   Documento em Firestore: coleção "horarios"
   Campos: dia, titulo, descricao, hora, ordem
   ================================================================== */
async function getHorarios() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_HORARIOS;
  try {
    const { collection, getDocs, query, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'horarios'), orderBy('ordem')));
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return lista.length ? lista : EXEMPLO_HORARIOS;
  } catch (err) {
    console.warn('Erro ao buscar horários, usando exemplo.', err);
    return EXEMPLO_HORARIOS;
  }
}

async function salvarHorario(horario) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  if (horario.id) {
    const ref = doc(db, 'horarios', horario.id);
    const { id, ...resto } = horario;
    await setDoc(ref, resto);
    return horario.id;
  } else {
    const ref = await addDoc(collection(db, 'horarios'), horario);
    return ref.id;
  }
}

async function excluirHorario(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'horarios', id));
}

/* ==================================================================
   SOCIEDADES
   Documento em Firestore: coleção "sociedades", 1 doc por sigla
   (ucp, upa, ump, uph, saf), com os campos de SOCIEDADES_INFO.
   Agenda de cada sociedade: coleção "sociedades_agenda"
   Campos: sociedade (sigla), data, titulo, descricao
   ================================================================== */
async function getSociedadeInfo(sigla) {
  const ok = await initFirebase();
  const base = SOCIEDADES_INFO[sigla];
  if (!ok) return base;
  try {
    const { doc, getDoc } = firebaseModules;
    const snap = await getDoc(doc(db, 'sociedades', sigla));
    return snap.exists() ? { ...base, ...snap.data() } : base;
  } catch (err) {
    console.warn('Erro ao buscar sociedade, usando exemplo.', err);
    return base;
  }
}

async function salvarSociedadeInfo(sigla, dados) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, setDoc } = firebaseModules;
  await setDoc(doc(db, 'sociedades', sigla), dados, { merge: true });
}

async function getAgendaSociedade(sigla) {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_AGENDA_SOCIEDADE[sigla] || [];
  try {
    const { collection, getDocs, query, where, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'sociedades_agenda'), where('sociedade', '==', sigla), orderBy('data')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Erro ao buscar agenda da sociedade, usando exemplo.', err);
    return EXEMPLO_AGENDA_SOCIEDADE[sigla] || [];
  }
}

async function salvarAtividadeSociedade(sigla, atividade) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  const dados = { ...atividade, sociedade: sigla };
  if (atividade.id) {
    const ref = doc(db, 'sociedades_agenda', atividade.id);
    const { id, ...resto } = dados;
    await setDoc(ref, resto);
    return atividade.id;
  } else {
    const ref = await addDoc(collection(db, 'sociedades_agenda'), dados);
    return ref.id;
  }
}

async function excluirAtividadeSociedade(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'sociedades_agenda', id));
}

/* ==================================================================
   SOBRE — "Quem Somos" e "No Que Cremos"
   Documento único em Firestore: coleção "pagina_sobre", doc "principal"
   Campos: quemSomos, noQueCremos
   ================================================================== */
async function getSobre() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_SOBRE;
  try {
    const { doc, getDoc } = firebaseModules;
    const snap = await getDoc(doc(db, 'pagina_sobre', 'principal'));
    return snap.exists() ? { ...EXEMPLO_SOBRE, ...snap.data() } : EXEMPLO_SOBRE;
  } catch (err) {
    console.warn('Erro ao buscar página Sobre, usando exemplo.', err);
    return EXEMPLO_SOBRE;
  }
}

async function salvarSobre(dados) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, setDoc } = firebaseModules;
  await setDoc(doc(db, 'pagina_sobre', 'principal'), dados, { merge: true });
}

/* ==================================================================
   TEMAS — Estudo Bíblico e Culto de Oração
   Documento em Firestore: coleção "temas"
   Campos: tipo ("estudo" | "oracao"), data ("AAAA-MM"), titulo,
   conteudo (texto do estudo / motivos de oração)
   ================================================================== */
function exemploTemas(tipo) {
  return tipo === 'oracao' ? EXEMPLO_TEMAS_ORACAO : EXEMPLO_TEMAS_ESTUDO;
}

async function getTemas(tipo) {
  const ok = await initFirebase();
  if (!ok) return exemploTemas(tipo);
  try {
    const { collection, getDocs, query, where, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'temas'), where('tipo', '==', tipo), orderBy('data', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Erro ao buscar temas, usando exemplo.', err);
    return exemploTemas(tipo);
  }
}

async function salvarTema(tipo, tema) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  const dados = { ...tema, tipo };
  if (tema.id) {
    const ref = doc(db, 'temas', tema.id);
    const { id, ...resto } = dados;
    await setDoc(ref, resto);
    return tema.id;
  } else {
    const ref = await addDoc(collection(db, 'temas'), dados);
    return ref.id;
  }
}

async function excluirTema(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'temas', id));
}

/* ==================================================================
   PIPQ TV — links para YouTube e Instagram
   Documento único em Firestore: coleção "pipqtv", doc "principal"
   Campos: youtube, instagram
   ================================================================== */
async function getPipqTv() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_PIPQTV;
  try {
    const { doc, getDoc } = firebaseModules;
    const snap = await getDoc(doc(db, 'pipqtv', 'principal'));
    return snap.exists() ? { ...EXEMPLO_PIPQTV, ...snap.data() } : EXEMPLO_PIPQTV;
  } catch (err) {
    console.warn('Erro ao buscar links da PIPQ TV, usando exemplo.', err);
    return EXEMPLO_PIPQTV;
  }
}

async function salvarPipqTv(dados) {
  const ok = await initFirebase();
  if (!ok) throw new Error(mensagemFalhaFirebase());
  const { doc, setDoc } = firebaseModules;
  await setDoc(doc(db, 'pipqtv', 'principal'), dados, { merge: true });
}

export {
  FIREBASE_CONFIGURADO,
  SOCIEDADES_INFO,
  login,
  logout,
  onAuthChange,
  getEventos,
  salvarEvento,
  excluirEvento,
  getHorarios,
  salvarHorario,
  excluirHorario,
  getSociedadeInfo,
  salvarSociedadeInfo,
  getAgendaSociedade,
  salvarAtividadeSociedade,
  excluirAtividadeSociedade,
  getSobre,
  salvarSobre,
  getTemas,
  salvarTema,
  excluirTema,
  getPipqTv,
  salvarPipqTv,
};
