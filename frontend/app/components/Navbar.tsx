import { Link, NavLink } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '~/lib/utils';
import { useNotificationStats, useNotifications, useOptionalUser } from '~/root';

export const Navbar = ({ logo }: { logo: string }) => {
    const user = useOptionalUser();
    const notificationStats = useNotificationStats();
    const notifications = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobileNotificationOpen, setIsMobileNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const toggleMobileNotifications = () => {
        setIsMobileNotificationOpen(!isMobileNotificationOpen);
    };

    // Fermer le dropdown si on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Composant Badge pour afficher les nombres - couleur changée vers orange/vert
    const Badge = ({ count, pulse = false }: { count: number; pulse?: boolean }) => {
        if (count === 0) return null;
        return (
            <span 
                className={`absolute -top-1 -right-1 bg-vert text-bleu text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center ${
                    pulse ? 'animate-pulse' : ''
                }`}
            >
                {count > 9 ? '9+' : count}
            </span>
        );
    };

    // Composant Notification Item
    const NotificationItem = ({ notification, isMobile = false }: { notification: any; isMobile?: boolean }) => {
        const getIcon = () => {
            switch (notification.type) {
                case 'pending_offer':
                    return '💰';
                case 'message':
                    return '💬';
                case 'transaction':
                    return '🔔';
                default:
                    return '📢';
            }
        };

        return (
            <Link 
                to={`/transactions/${notification.transactionId}`}
                className={`block p-3 border-b transition-colors ${
                    isMobile 
                        ? `${notification.urgent ? 'bg-orange-900/30 border-orange-700/50' : 'bg-white/5 border-white/10'} hover:bg-white/10`
                        : `${notification.urgent ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'} hover:bg-gray-50`
                }`}
                onClick={() => {
                    setIsNotificationOpen(false);
                    setIsMobileNotificationOpen(false);
                    setIsMenuOpen(false);
                }}
            >
                <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{getIcon()}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                                isMobile 
                                    ? (notification.urgent ? 'text-orange-200' : 'text-white') 
                                    : (notification.urgent ? 'text-orange-800' : 'text-gray-900')
                            }`}>
                                {notification.title}
                            </p>
                            {notification.urgent && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isMobile 
                                        ? 'bg-orange-200 text-orange-800' 
                                        : 'bg-orange-100 text-orange-800'
                                }`}>
                                    Urgent
                                </span>
                            )}
                        </div>
                        <p className={`text-sm mt-1 line-clamp-2 ${
                            isMobile ? 'text-white/80' : 'text-gray-600'
                        }`}>
                            {notification.description}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isMobile ? 'text-white/60' : 'text-gray-400'
                        }`}>
                            {formatDate({ date: notification.createdAt })}
                        </p>
                    </div>
                </div>
            </Link>
        );
    };

    // Composant Dropdown Notifications
    const NotificationDropdown = () => {
        if (!notifications || notifications.length === 0) {
            return (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 text-center text-gray-500">
                        <span className="text-2xl block mb-2">🔔</span>
                        <p>Aucune notification</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <Link 
                        to="/transactions" 
                        className="text-sm text-bleu hover:text-bleuClair font-medium"
                        onClick={() => setIsNotificationOpen(false)}
                    >
                        Voir toutes les demandes →
                    </Link>
                </div>
            </div>
        );
    };

    // Composant Mobile Notifications
    const MobileNotificationsList = () => {
        if (!notifications || notifications.length === 0) {
            return (
                <div className="p-4 text-center text-white/70">
                    <span className="text-2xl block mb-2">🔔</span>
                    <p>Aucune notification</p>
                </div>
            );
        }

        return (
            <div className="max-h-64 overflow-y-auto bg-bleu/80 rounded-md border border-white/20">
                {notifications.slice(0, 5).map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} isMobile={true} />
                ))}
                <div className="p-3 border-t border-white/20 bg-bleu/60">
                    <Link 
                        to="/transactions" 
                        className="text-sm text-vert hover:text-bleuClair font-medium"
                        onClick={() => {
                            setIsMobileNotificationOpen(false);
                            setIsMenuOpen(false);
                        }}
                    >
                        Voir toutes les demandes →
                    </Link>
                </div>
            </div>
        );
    };

    // Styles pour les liens de navigation
    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `text-sm font-medium transition-colors px-3 py-2 rounded-md relative ${
            isActive 
                ? 'bg-white/20 text-white border-b-2 border-vert' 
                : 'hover:text-bleuClair hover:bg-white/10'
        }`;

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `text-sm font-medium transition-colors px-3 py-2 rounded-md text-center relative ${
            isActive 
                ? 'bg-white/20 text-white border-l-4 border-vert' 
                : 'hover:text-bleuClair hover:bg-white/10'
        }`;

    return (
        <nav className='px-4 sm:px-6 py-4 bg-bleu text-white shadow-lg'>
            <div className='max-w-7xl mx-auto flex justify-between items-center'>
                <Link to='/' className='hover:opacity-80 transition-opacity'>
                    <img src={logo} className='w-full h-auto max-w-[100px] sm:max-w-[140px]' alt='Logo' />
                </Link>
                
                {/* Menu hamburger pour mobile */}
                <button
                    onClick={toggleMenu}
                    className='lg:hidden flex flex-col gap-1 p-2 relative'
                    aria-label='Toggle menu'
                >
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                    {/* Badge total pour le menu mobile */}
                    {notificationStats && (
                        <Badge 
                            count={notificationStats.pendingOffers + notificationStats.pendingReplies} 
                            pulse={notificationStats.pendingOffers > 0}
                        />
                    )}
                </button>
                
                {/* Menu desktop */}
                <div className='hidden lg:flex items-center gap-6'>
                    {user ? (
                        <>
                            <span className='text-sm font-medium bg-white/10 px-3 py-1 rounded-full'>
                                Bonjour, {user.name}
                            </span>
                            
                            <div className='flex items-center gap-4'>
                                <NavLink 
                                    to='/transactions' 
                                    className={navLinkClass}
                                >
                                    Mes demandes
                                    {notificationStats && (
                                        <Badge 
                                            count={notificationStats.pendingOffers + notificationStats.pendingReplies} 
                                            pulse={notificationStats.pendingOffers > 0 || notificationStats.pendingReplies > 0}
                                        />
                                    )}
                                </NavLink>
                                
                                <NavLink 
                                    to='/my-services' 
                                    className={navLinkClass}
                                >
                                    Mes services
                                    {notificationStats && (
                                        <Badge 
                                            count={notificationStats.activeOffers} 
                                        />
                                    )}
                                </NavLink>
                                
                                {/* Dropdown Notifications */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={toggleNotifications}
                                        className="text-sm font-medium hover:text-bleuClair transition-colors px-3 py-2 rounded-md hover:bg-white/10 relative"
                                    >
                                        🔔
                                        {notificationStats && (
                                            <Badge 
                                                count={notificationStats.pendingOffers + notificationStats.pendingReplies} 
                                                pulse={notificationStats.pendingOffers > 0 || notificationStats.pendingReplies > 0}
                                            />
                                        )}
                                    </button>
                                    
                                    {isNotificationOpen && <NotificationDropdown />}
                                </div>
                                
                                <NavLink 
                                    to='/profile' 
                                    className={navLinkClass}
                                >
                                    Mon profil
                                </NavLink>
                                
                                <form method='POST' action='/auth/logout'>
                                    <button 
                                        type='submit' 
                                        className='text-sm font-medium hover:text-khmerCurry transition-colors px-3 py-2 rounded-md hover:bg-white/10'
                                    >
                                        Se déconnecter
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className='flex items-center gap-4'>
                            <NavLink 
                                to='/login' 
                                className={navLinkClass}
                            >
                                Connexion
                            </NavLink>
                            <Link 
                                to='/register' 
                                className='text-sm font-medium bg-vert text-bleu px-4 py-2 rounded-md hover:bg-vert/90 transition-colors'
                            >
                                Inscription
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Menu mobile */}
            <div className={`lg:hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className='pt-4 pb-2 border-t border-white/20 mt-4'>
                    {user ? (
                        <div className='flex flex-col gap-3'>
                            <div className='text-sm font-medium bg-white/10 px-3 py-2 rounded-md text-center'>
                                Bonjour, {user.name}
                            </div>
                            
                            {/* Bouton Notifications Mobile */}
                            <button
                                onClick={toggleMobileNotifications}
                                className='text-sm font-medium hover:text-bleuClair transition-colors px-3 py-2 rounded-md hover:bg-white/10 text-center relative flex items-center justify-center gap-2'
                            >
                                <span>🔔 Notifications</span>
                                {notificationStats && (
                                    <span className={`bg-vert text-bleu text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center ${
                                        notificationStats.pendingOffers > 0 || notificationStats.pendingReplies > 0 ? 'animate-pulse' : ''
                                    }`}>
                                        {(notificationStats.pendingOffers + notificationStats.pendingReplies) > 9 ? '9+' : (notificationStats.pendingOffers + notificationStats.pendingReplies)}
                                    </span>
                                )}
                            </button>
                            
                            {/* Liste des notifications mobile */}
                            {isMobileNotificationOpen && (
                                <div className="mx-2 mb-2">
                                    <MobileNotificationsList />
                                </div>
                            )}
                            
                            <NavLink 
                                to='/transactions' 
                                className={mobileNavLinkClass}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>Mes demandes</span>
                                {notificationStats && (
                                    <Badge 
                                        count={notificationStats.pendingOffers + notificationStats.pendingReplies} 
                                        pulse={notificationStats.pendingOffers > 0 || notificationStats.pendingReplies > 0}
                                    />
                                )}
                            </NavLink>
                            
                            <NavLink 
                                to='/my-services' 
                                className={mobileNavLinkClass}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>Mes services</span>
                                {notificationStats && (
                                    <Badge 
                                        count={notificationStats.activeOffers} 
                                    />
                                )}
                            </NavLink>
                            
                            <NavLink 
                                to='/profile' 
                                className={mobileNavLinkClass}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Mon profil
                            </NavLink>
                            
                            <form method='POST' action='/auth/logout' className='w-full'>
                                <button 
                                    type='submit' 
                                    className='w-full text-sm font-medium hover:text-khmerCurry transition-colors px-3 py-2 rounded-md hover:bg-white/10'
                                >
                                    Se déconnecter
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-3'>
                            <NavLink 
                                to='/login' 
                                className={mobileNavLinkClass}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Connexion
                            </NavLink>
                            <Link 
                                to='/register' 
                                className='text-sm font-medium bg-vert text-bleu px-4 py-2 rounded-md hover:bg-vert/90 transition-colors text-center'
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Inscription
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
