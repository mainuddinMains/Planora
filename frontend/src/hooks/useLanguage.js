import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    weekly: 'Weekly',
    today: 'Today',
    emailSync: 'Email Sync',
    addTask: '+ Add Task',
    profile: 'Profile',
    logout: 'Logout',
    changePassword: 'Change Password',
    welcome: 'Welcome',
    yourTasks: 'Your Tasks',
    noTasks: 'No tasks yet',
    addNewTask: 'Add New Task',
    editTask: 'Edit Task',
    title: 'Title',
    description: 'Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    course: 'Course',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    complete: 'Complete',
    settings: 'Settings',
    language: 'Language',
    aiAssistant: 'AI Study Assistant',
    connectMicrosoft: 'Sign in with Microsoft',
    syncNow: 'Sync Now',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  es: {
    dashboard: 'Panel',
    tasks: 'Tareas',
    weekly: 'Semanal',
    today: 'Hoy',
    emailSync: 'Sincronizar Email',
    addTask: '+ Agregar Tarea',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    changePassword: 'Cambiar Contraseña',
    welcome: 'Bienvenido',
    yourTasks: 'Tus Tareas',
    noTasks: 'Sin tareas aún',
    addNewTask: 'Agregar Nueva Tarea',
    editTask: 'Editar Tarea',
    title: 'Título',
    description: 'Descripción',
    dueDate: 'Fecha de Vencimiento',
    priority: 'Prioridad',
    course: 'Curso',
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    complete: 'Completar',
    settings: 'Configuración',
    language: 'Idioma',
    aiAssistant: 'Asistente de Estudio IA',
    connectMicrosoft: 'Iniciar sesión con Microsoft',
    syncNow: 'Sincronizar Ahora',
    connected: 'Conectado',
    disconnected: 'Desconectado',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    tasks: 'Tâches',
    weekly: 'Hebdomadaire',
    today: "Aujourd'hui",
    emailSync: 'Sync Email',
    addTask: '+ Ajouter Tâche',
    profile: 'Profil',
    logout: 'Déconnexion',
    changePassword: 'Changer le Mot de Passe',
    welcome: 'Bienvenue',
    yourTasks: 'Vos Tâches',
    noTasks: 'Pas encore de tâches',
    addNewTask: 'Ajouter Nouvelle Tâche',
    editTask: 'Modifier Tâche',
    title: 'Titre',
    description: 'Description',
    dueDate: "Date d'échéance",
    priority: 'Priorité',
    course: 'Cours',
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    complete: 'Terminer',
    settings: 'Paramètres',
    language: 'Langue',
    aiAssistant: 'Assistant Étude IA',
    connectMicrosoft: 'Se connecter avec Microsoft',
    syncNow: 'Synchroniser',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    tasks: 'المهام',
    weekly: 'أسبوعي',
    today: 'اليوم',
    emailSync: 'مزامنة البريد',
    addTask: '+ إضافة مهمة',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    changePassword: 'تغيير كلمة المرور',
    welcome: 'مرحبا',
    yourTasks: 'مهامك',
    noTasks: 'لا توجد مهام بعد',
    addNewTask: 'إضافة مهمة جديدة',
    editTask: 'تعديل المهمة',
    title: 'العنوان',
    description: 'الوصف',
    dueDate: 'تاريخ الاستحقاق',
    priority: 'الأولوية',
    course: 'المقرر',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    complete: 'إكمال',
    settings: 'الإعدادات',
    language: 'اللغة',
    aiAssistant: 'مساعد الدراسة الذكي',
    connectMicrosoft: 'تسجيل الدخول عبر Microsoft',
    syncNow: 'مزامنة الآن',
    connected: 'متصل',
    disconnected: 'غير متصل',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];
