import { ArrowRight, BellOff, CheckCheck, X, AlertTriangle, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function NotificationsScreen({ onBack }: Props) {
  const { isDark } = useTheme();
  const { notifications, unreadCount, dismissNotification, markAllRead, markAsRead, isRead } = useNotifications();

  const getIcon = (type: string, isUrgent: boolean) => {
    if (type === 'completed') return <CheckCircle size={20} className="text-green-500" />;
    if (type === 'you_owe') return <CreditCard size={20} className="text-blue-500" />;
    if (isUrgent) return <AlertTriangle size={20} className="text-red-500" />;
    return <Clock size={20} className="text-yellow-500" />;
  };

  const getBgColor = (type: string, isUrgent: boolean, read: boolean) => {
    if (read) return isDark ? 'bg-gray-800/50' : 'bg-gray-50';
    if (type === 'completed') return isDark ? 'bg-green-900/30' : 'bg-green-50';
    if (isUrgent) return isDark ? 'bg-red-900/30' : 'bg-red-50';
    if (type === 'you_owe') return isDark ? 'bg-blue-900/30' : 'bg-blue-50';
    return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
  };

  const getBorderColor = (type: string, isUrgent: boolean, read: boolean) => {
    if (read) return isDark ? 'border-gray-700' : 'border-gray-200';
    if (type === 'completed') return 'border-green-400';
    if (isUrgent) return 'border-red-400';
    if (type === 'you_owe') return 'border-blue-400';
    return 'border-yellow-400';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-20 ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <ArrowRight size={22} className={isDark ? 'text-gray-300' : 'text-gray-700'} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>الإشعارات</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {unreadCount > 0 ? `${unreadCount} غير مقروءة` : 'لا توجد إشعارات جديدة'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-200 transition-colors"
            >
              <CheckCheck size={16} />
              قراءة الكل
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
              <BellOff size={36} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>لا توجد إشعارات</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ستظهر هنا عند وجود تحديثات جديدة</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const read = isRead(notif.id);
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`relative p-4 rounded-2xl border-r-4 ${getBgColor(notif.type, notif.isUrgent, read)} ${getBorderColor(notif.type, notif.isUrgent, read)} transition-all duration-300 cursor-pointer`}
              >
                {/* زر الحذف */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notif.id);
                  }}
                  className={`absolute top-3 left-3 p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'} transition-colors`}
                >
                  <X size={16} />
                </button>

                <div className="flex items-start gap-3 ml-8">
                  {/* أيقونة */}
                  <div className={`mt-0.5 p-2 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                    {getIcon(notif.type, notif.isUrgent)}
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${read ? 'opacity-60' : ''}`}>
                        {notif.title}
                      </h3>
                      {!read && (
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                      )}
                      {notif.isUrgent && !read && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">عاجل</span>
                      )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} ${read ? 'opacity-60' : ''}`}>
                      {notif.message}
                    </p>
                    {notif.groupName && (
                      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                        📁 {notif.groupName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
