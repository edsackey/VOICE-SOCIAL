
import { Locale } from '../types';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    app_name: 'Chat-Chap',
    rooms: 'Rooms',
    calls: 'Connect',
    pulse: 'Pulse',
    schedule: 'Schedule',
    groups: 'Groups',
    files: 'Files',
    creator_studio: 'Creator Studio',
    leave: 'Leave',
    recording: 'Recording',
    support_creator: 'Support Creator',
    join_conversation: 'Join Conversation',
    launch_room: 'Launch a Room',
    welcome_back: 'Welcome Back',
    join_tribe: 'Join the Tribe',
    revenue: 'Revenue',
    audience: 'Audience',
    ledger: 'Transaction Ledger',
    native_lang: 'Native Language'
  },
  fr: {
    app_name: 'Chat-Chap',
    rooms: 'Salons',
    calls: 'Connecter',
    pulse: 'Impulsion',
    schedule: 'Calendrier',
    groups: 'Groupes',
    files: 'Fichiers',
    creator_studio: 'Studio Créateur',
    leave: 'Quitter',
    recording: 'Enregistrement',
    support_creator: 'Soutenir',
    join_conversation: 'Rejoindre',
    launch_room: 'Lancer un salon',
    welcome_back: 'Bon retour',
    join_tribe: 'Rejoindre la tribu',
    revenue: 'Revenus',
    audience: 'Audience',
    ledger: 'Grand Livre',
    native_lang: 'Langue Maternelle'
  },
  es: {
    app_name: 'Chat-Chap',
    rooms: 'Salas',
    calls: 'Conectar',
    pulse: 'Pulso',
    schedule: 'Horario',
    groups: 'Grupos',
    files: 'Archivos',
    creator_studio: 'Estudio Creador',
    leave: 'Salir',
    recording: 'Grabando',
    support_creator: 'Apoyar',
    join_conversation: 'Unirse',
    launch_room: 'Lanzar Sala',
    welcome_back: 'Bienvenido',
    join_tribe: 'Únete a la tribu',
    revenue: 'Ingresos',
    audience: 'Audiencia',
    ledger: 'Libro Mayor',
    native_lang: 'Idioma Nativo'
  },
  pt: { app_name: 'Chat-Chap', rooms: 'Salas', calls: 'Conectar', pulse: 'Pulso', schedule: 'Agenda', groups: 'Grupos', files: 'Arquivos', creator_studio: 'Estúdio', leave: 'Sair', recording: 'Gravando', support_creator: 'Apoiar', join_conversation: 'Entrar', launch_room: 'Lançar', welcome_back: 'Bem-vindo', join_tribe: 'Entrar', revenue: 'Receita', audience: 'Público', ledger: 'Livro', native_lang: 'Língua Nativa' },
  de: { app_name: 'Chat-Chap', rooms: 'Räume', calls: 'Verbinden', pulse: 'Puls', schedule: 'Zeitplan', groups: 'Gruppen', files: 'Dateien', creator_studio: 'Studio', leave: 'Verlassen', recording: 'Aufnahme', support_creator: 'Unterstützen', join_conversation: 'Beitreten', launch_room: 'Starten', welcome_back: 'Willkommen', join_tribe: 'Beitreten', revenue: 'Einnahmen', audience: 'Publikum', ledger: 'Hauptbuch', native_lang: 'Muttersprache' },
  zh: { app_name: 'Chat-Chap', rooms: '房间', calls: '连接', pulse: '脉搏', schedule: '日程', groups: '群组', files: '文件', creator_studio: '工作室', leave: '离开', recording: '录音', support_creator: '支持', join_conversation: '加入对话', launch_room: '启动', welcome_back: '欢迎回来', join_tribe: '加入', revenue: '收入', audience: '受众', ledger: '分类账', native_lang: '母语' },
  tw: { app_name: 'Chat-Chap', rooms: 'Aseeae', calls: 'Nkabom', pulse: 'Abobow', schedule: 'Nhyehyɛe', groups: 'Ekuo', files: 'Fael', creator_studio: 'Studio', leave: 'Firi mu', recording: 'Kyere mu', support_creator: 'Boa', join_conversation: 'Kɔ mu', launch_room: 'Fi ase', welcome_back: 'Akwaaba', join_tribe: 'Kɔ mu', revenue: 'Sika', audience: 'Atiefoɔ', ledger: 'Nwoma', native_lang: 'Wo kasa' },
  sw: { app_name: 'Chat-Chap', rooms: 'Vyumba', calls: 'Ungana', pulse: 'Mapigo', schedule: 'Ratiba', groups: 'Vikundi', files: 'Faili', creator_studio: 'Studio', leave: 'Ondoka', recording: 'Kurekodi', support_creator: 'Saidia', join_conversation: 'Jiunge', launch_room: 'Anzisha', welcome_back: 'Karibu tena', join_tribe: 'Jiunge', revenue: 'Mapato', audience: 'Watazamaji', ledger: 'Leja', native_lang: 'Lugha ya Asili' },
  yo: { app_name: 'Chat-Chap', rooms: 'Iyara', calls: 'Sopọ', pulse: 'Ilu', schedule: 'Eto', groups: 'Ẹgbẹ', files: 'Awọn faili', creator_studio: 'Studio', leave: 'Jade', recording: 'Gbigbasilẹ', support_creator: 'Atilẹyin', join_conversation: 'Darapọ mọ', launch_room: 'Bẹrẹ', welcome_back: 'Kaabo pada', join_tribe: 'Darapọ', revenue: 'Owo', audience: 'Olugbo', ledger: 'Iwe', native_lang: 'Ede abinibi' },
  zu: { app_name: 'Chat-Chap', rooms: 'Amakamelo', calls: 'Xhuma', pulse: 'I-Pulse', schedule: 'Isheduli', groups: 'Amaqembu', files: 'Amafayela', creator_studio: 'I-Studio', leave: 'Hamba', recording: 'Ukuqopha', support_creator: 'Sekela', join_conversation: 'Joyina', launch_room: 'Qala', welcome_back: 'Uyakwamukelwa', join_tribe: 'Joyina', revenue: 'Imali', audience: 'Izilaleli', ledger: 'Incwadi', native_lang: 'Ulimi Lwasekhaya' },
  am: { app_name: 'Chat-Chap', rooms: 'ክፍሎች', calls: 'ተገናኝ', pulse: 'ልብ ምት', schedule: 'መርሃ ግብር', groups: 'ቡድኖች', files: 'ፋይሎች', creator_studio: 'ስቱዲዮ', leave: 'ውጣ', recording: 'መቅዳት', support_creator: 'ደግፍ', join_conversation: 'ተቀላቀል', launch_room: 'ጀምር', welcome_back: 'እንኳን ደህና መጡ', join_tribe: 'ተቀላቀል', revenue: 'ገቢ', audience: 'ታዳሚ', ledger: 'የሂሳብ መዝገብ', native_lang: 'የአፍ መፍቻ ቋንቋ' },
  wo: { app_name: 'Chat-Chap', rooms: 'Néeg yi', calls: 'Lekkolo', pulse: 'Pulse', schedule: 'Program', groups: 'Mboolo yi', files: 'Fise yi', creator_studio: 'Studio', leave: 'Génn', recording: 'Enregistré', support_creator: 'Dimbali', join_conversation: 'Bokk', launch_room: 'Samp', welcome_back: 'Aksil ak jàmm', join_tribe: 'Bokk', revenue: 'Xaalis', audience: 'Téew yi', ledger: 'Kaaye', native_lang: 'Sa làkk' }
};

export const getTranslation = (key: string, locale: Locale = 'en'): string => {
  return translations[locale][key] || translations['en'][key] || key;
};
