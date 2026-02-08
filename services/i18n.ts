
import { Locale } from '../types';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    app_name: 'VOICE SOCIAL',
    rooms: 'Rooms',
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
    ledger: 'Transaction Ledger'
  },
  fr: {
    app_name: 'VOICE SOCIAL',
    rooms: 'Salons',
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
    ledger: 'Grand Livre'
  },
  es: {
    app_name: 'VOICE SOCIAL',
    rooms: 'Salas',
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
    ledger: 'Libro Mayor'
  }
};

export const getTranslation = (key: string, locale: Locale = 'en'): string => {
  return translations[locale][key] || translations['en'][key] || key;
};
