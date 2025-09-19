'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { SyncStatusCompact } from '@/components/SyncStatus';
import UserProfileModal from '@/components/UserProfileModal';
import { useNotifications, formatRelativeTime, getNotificationColor } from '@/hooks/useNotifications';
import { 
  Home, 
  Users, 
  FileText, 
  History, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Alunos', href: '/students', icon: Users },
  { name: 'Anamneses', href: '/anamneses', icon: FileText },
  { name: 'Histórico', href: '/history', icon: History },
];

export default function AppLayout({ children, title, showBackButton = false, backUrl }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Hook para notificações
  const { 
    notifications, 
    loading: notificationsLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-1.5 sm:p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>

              {/* Logo/Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Link href="https://hidroginastica-arpa.base44.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    <img src="/arpa-logo.svg" alt="ARPA Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <span className="font-bold text-lg sm:text-xl text-gray-900 hidden xs:block">
                    Anamnese
                  </span>
                </Link>
                
                {title && (
                  <>
                    <span className="text-gray-400 hidden sm:inline">/</span>
                    <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
              {/* Sync Status */}
              <div className="hidden sm:block">
                <SyncStatusCompact />
              </div>
              
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-1.5 sm:p-2"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {/* Notification badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 lg:w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Notificações</h3>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs sm:text-sm p-1 sm:p-2"
                        >
                          <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden lg:inline">Marcar todas como lidas</span>
                          <span className="lg:hidden">Marcar todas</span>
                        </Button>
                      )}
                    </div>
                    <div className="max-h-60 sm:max-h-80 lg:max-h-96 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Carregando notificações...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Nenhuma notificação encontrada
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className={`w-2 h-2 ${getNotificationColor(notification.type)} rounded-full mt-1.5 sm:mt-2 flex-shrink-0`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs sm:text-sm font-medium text-gray-900 leading-tight ${
                                      !notification.read ? 'font-semibold' : ''
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words leading-tight">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                                      {formatRelativeTime(notification.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                    {!notification.read && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => markAsRead(notification.id)}
                                        className="p-1 h-5 w-5 sm:h-6 sm:w-6 text-blue-600 hover:text-blue-700"
                                        title="Marcar como lida"
                                      >
                                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => deleteNotification(notification.id)}
                                      className="p-1 h-5 w-5 sm:h-6 sm:w-6 text-red-600 hover:text-red-700"
                                      title="Excluir notificação"
                                    >
                                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 sm:p-3 border-t border-gray-200">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-center text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          Fechar notificações
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <div 
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1 sm:p-2 transition-colors"
                onClick={() => setIsProfileModalOpen(true)}
                title="Clique para editar seu perfil"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-xs sm:text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 p-1.5 sm:p-2"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>

        {/* User Profile Modal */}
        <UserProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <nav className="px-3 sm:px-4 py-2 sm:py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Sync Status */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="px-3 py-2">
                  <SyncStatusCompact />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Back Button */}
      {showBackButton && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <X className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 mobile-nav z-40 safe-area-inset-bottom">
        <nav className="flex items-center justify-around py-1.5 sm:py-2 px-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors min-w-0 flex-1 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                <span className="text-xs leading-tight truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16 sm:h-18"></div>
    </div>
  );
}

// HOC for pages that need authentication and layout
export function withAppLayout<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  layoutProps?: Omit<AppLayoutProps, 'children'>
) {
  return function WithAppLayoutComponent(props: P) {
    return (
      <AppLayout {...layoutProps}>
        <WrappedComponent {...props} />
      </AppLayout>
    );
  };
}