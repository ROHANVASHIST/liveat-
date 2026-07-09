import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'pt';

interface Translations {
  [key: string]: { [lang in Language]?: string };
}

const translations: Translations = {
  'chat.title': { en: 'LiveAt', es: 'LiveAt', fr: 'LiveAt', de: 'LiveAt', ja: 'ライブアット', zh: 'LiveAt', ar: 'لايفأت', pt: 'LiveAt' },
  'chat.online': { en: 'online', es: 'en línea', fr: 'en ligne', de: 'online', ja: 'オンライン', zh: '在线', ar: 'متصل', pt: 'online' },
  'chat.offline': { en: 'offline', es: 'desconectado', fr: 'hors ligne', de: 'offline', ja: 'オフライン', zh: '离线', ar: 'غير متصل', pt: 'offline' },
  'chat.away': { en: 'away', es: 'ausente', fr: 'absent', de: 'abwesend', ja: '離席中', zh: '离开', ar: 'بعيد', pt: 'ausente' },
  'chat.busy': { en: 'Do Not Disturb', es: 'No molestar', fr: 'Ne pas déranger', de: 'Nicht stören', ja: '取り込み中', zh: '请勿打扰', ar: 'مشغول', pt: 'Não perturbe' },
  'chat.search': { en: 'Search...', es: 'Buscar...', fr: 'Rechercher...', de: 'Suchen...', ja: '検索...', zh: '搜索...', ar: 'بحث...', pt: 'Pesquisar...' },
  'chat.send': { en: 'Send', es: 'Enviar', fr: 'Envoyer', de: 'Senden', ja: '送信', zh: '发送', ar: 'إرسال', pt: 'Enviar' },
  'chat.message': { en: 'Message', es: 'Mensaje', fr: 'Message', de: 'Nachricht', ja: 'メッセージ', zh: '消息', ar: 'رسالة', pt: 'Mensagem' },
  'chat.settings': { en: 'Settings', es: 'Ajustes', fr: 'Paramètres', de: 'Einstellungen', ja: '設定', zh: '设置', ar: 'الإعدادات', pt: 'Configurações' },
  'chat.contacts': { en: 'Contacts', es: 'Contactos', fr: 'Contacts', de: 'Kontakte', ja: '連絡先', zh: '联系人', ar: 'جهات الاتصال', pt: 'Contatos' },
  'chat.rooms': { en: 'Rooms', es: 'Salas', fr: 'Salons', de: 'Räume', ja: 'ルーム', zh: '房间', ar: 'الغرف', pt: 'Salas' },
  'chat.typing': { en: 'typing', es: 'escribiendo', fr: 'tape', de: 'tippt', ja: '入力中', zh: '正在输入', ar: 'يكتب', pt: 'digitando' },
  'chat.connecting': { en: 'Connecting...', es: 'Conectando...', fr: 'Connexion...', de: 'Verbinde...', ja: '接続中...', zh: '连接中...', ar: 'جارٍ الاتصال...', pt: 'Conectando...' },
  'chat.reconnecting': { en: 'Reconnecting...', es: 'Reconectando...', fr: 'Reconnexion...', de: 'Wiederverbinden...', ja: '再接続中...', zh: '重新连接中...', ar: 'جارٍ إعادة الاتصال...', pt: 'Reconectando...' },
  'chat.disconnected': { en: 'Disconnected', es: 'Desconectado', fr: 'Déconnecté', de: 'Getrennt', ja: '切断されました', zh: '已断开连接', ar: 'غير متصل', pt: 'Desconectado' },
  'chat.noMessages': { en: 'No messages yet', es: 'Sin mensajes', fr: 'Aucun message', de: 'Keine Nachrichten', ja: 'メッセージがありません', zh: '暂无消息', ar: 'لا توجد رسائل', pt: 'Nenhuma mensagem' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ui-language');
    if (saved && ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'].includes(saved)) {
      return saved as Language;
    }
    return 'en';
  });

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation['en'] || key;
  }, [language]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ui-language', lang);
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

export type { Language };