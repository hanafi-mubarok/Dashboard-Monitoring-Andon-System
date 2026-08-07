"use client"

import { useState, ReactNode, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Database, 
  Settings, 
  Users, 
  FileText,
  Package,
  ClipboardList,
  Search,
  LogOut,
  HelpCircle,
  Menu,
  BellRing,
  X
} from 'lucide-react';
import NotificationModal from './NotificationModal';

interface SubmenuItem {
  id: string;
  label: string;
  path: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  submenu?: SubmenuItem[];
}

interface MenuItemProps {
  item: MenuItem;
  isOpen: boolean;
  activeMenu: string;
  expandedMenus: string[];
  onNavigate: (path: string) => void;
  toggleSubmenu: (id: string) => void;
}

interface ModernSidebarProps {
  children?: ReactNode;
}

interface SidebarUserProfile {
  name: string;
  department: string;
}

const MenuItemComponent = ({ 
  item, 
  isOpen, 
  activeMenu, 
  expandedMenus, 
  onNavigate,
  toggleSubmenu 
}: MenuItemProps) => {
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isActive = activeMenu === item.id || (hasSubmenu && activeMenu.startsWith(`${item.id}-`));
  const isExpanded = expandedMenus.includes(item.id) || (hasSubmenu && activeMenu.startsWith(`${item.id}-`));

  const handleClick = () => {
    if (hasSubmenu) {
      toggleSubmenu(item.id);
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
          transition-all duration-200 group relative
          ${isActive 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
          }
          ${!isOpen && 'justify-center'}
        `}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
          {isOpen && (
            <span className="font-medium text-sm">{item.label}</span>
          )}
        </div>
        
        {isOpen && (
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        )}

        {!isOpen && item.badge && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {hasSubmenu && isExpanded && isOpen && (
        <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-800 space-y-1">
          {item.submenu!.map((subItem) => (
            <button
              key={subItem.id}
              onClick={() => onNavigate(subItem.path)}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm
                transition-all duration-200
                ${activeMenu === subItem.id
                  ? 'bg-gray-800 text-blue-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }
              `}
            >
              {subItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ModernSidebar = ({ children }: ModernSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [userProfile, setUserProfile] = useState<SidebarUserProfile>({
    name: 'Admin User',
    department: '-',
  });

  const userInitials = userProfile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AU';

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();
      const user = data?.user;

      if (user?.name) {
        setUserProfile({
          name: String(user.name),
          department: String(user.department || '-'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/kurang-komponen', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        
        setNotifications(newNotifications);
        
        // Jika modal tidak terbuka, set counter = actual count (bukan increment)
        if (!isNotificationModalOpen) {
          setUnreadNotificationCount(newNotifications.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  // Auto-fetch notifications setiap 1 menit
  useEffect(() => {
    fetchCurrentUser();
    fetchNotifications(); // Fetch saat component mount
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // 1 menit
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async () => {
    if (!isNotificationModalOpen) {
      await fetchNotifications();
      setUnreadNotificationCount(0); // Reset badge ketika modal dibuka
    }
    setIsNotificationModalOpen(!isNotificationModalOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");      // pindah ke login
      router.refresh();              // pastikan state server/middleware ikut kebaca
    }
  };

  const handleMarkAsRead = () => {
    setUnreadNotificationCount(0);
  };

  // Set active menu based on current pathname
  const getActiveMenu = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname.startsWith('/andon-monitoring')) return 'andon-monitoring';
    if (pathname.startsWith('/material/monitoring-kpm')) return 'material-monitoring-kpm';
    if (pathname.startsWith('/material/potensi-kekurangan')) return 'material-potensi-kekurangan';
    if (pathname.startsWith('/material/plotting-material')) return 'material-plotting';
    if (pathname.startsWith('/material/pengadaan')) return 'material-pengadaan';
    if (pathname.startsWith('/material')) return 'material-cetak-kpm-lantai3';
    if (pathname === '/operator' || pathname.startsWith('/operator/')) return 'operator-profile';
    if (pathname.startsWith('/penugasan-operator')) return 'operator-assignment';
    if (pathname.startsWith('/schedule/lantai-1')) return 'schedule-lantai1';
    if (pathname.startsWith('/schedule/lantai-2')) return 'schedule-lantai2';
    if (pathname.startsWith('/schedule/tiron')) return 'schedule-tiron';
    if (pathname.startsWith('/schedule/sukosari')) return 'schedule-sukosari';
    if (pathname.startsWith('/schedule')) return 'schedule-lantai3';
    if (pathname.startsWith('/product/lantai-1')) return 'product-pengerjaan-lantai1';
    if (pathname.startsWith('/product/lantai-2')) return 'product-pengerjaan-lantai2';
    if (pathname.startsWith('/product/tiron')) return 'product-pengerjaan-tiron';
    if (pathname.startsWith('/product/sukosari')) return 'product-pengerjaan-sukosari';
    if (pathname === '/product' || pathname.startsWith('/product/')) return 'product-pengerjaan-lantai3';
    if (pathname.startsWith('/product-tracking')) return 'product-tracking';
    if (pathname.startsWith('/project/tambah-project')) return 'project-tambah-project';
    if (pathname.startsWith('/project/value-stream-mapping')) return 'project-value-stream-mapping';
    if (pathname.startsWith('/project')) return 'project-tambah-project';
    if (pathname.startsWith('/production-progress/lantai-1')) return 'production-lantai1';
    if (pathname.startsWith('/production-progress/lantai-2')) return 'production-lantai2';
    if (pathname.startsWith('/production-progress/tiron')) return 'production-tiron';
    if (pathname.startsWith('/production-progress/sukosari')) return 'production-sukosari';
    if (pathname.startsWith('/production-progress')) return 'production-workstation';
    if (pathname.startsWith('/production/logs')) return 'production-log';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeMenu = getActiveMenu();

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems: MenuItem[] = [
    
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/'
    },
    /*
    {
      id: 'andon-monitoring',
      label: 'Andon Monitoring',
      icon: Activity,
      path: '/andon-monitoring'
    },
    */
    {
      id: 'material',
      label: 'Material',
      icon: Database,
      submenu: [
        {
          id: 'material-pengadaan',
          label: 'Pengadaan Material',
          path: '/material/pengadaan'
        },
        {
          id: 'material-cetak-kpm-lantai3',
          label: 'Cetak KPM',
          path: '/material'
        },
        {
          id: 'material-monitoring-kpm',
          label: 'Monitoring KPM',
          path: '/material/monitoring-kpm'
        },
        {
          id: 'material-plotting',
          label: 'Plotting Material',
          path: '/material/plotting-material'
        },
        /*
        {
          id: 'material-potensi-kekurangan',
          label: 'Potensi Kekurangan Material',
          path: '/material/potensi-kekurangan'
        }
          */
        /*
        {
          id: 'material-tracking',
          label: 'Material Tracking',
          path: '/material/material-tracking'
        }
          */
      ]
    },
    {
      id: 'operator',
      label: 'Operator',
      icon: Users,
      submenu: [
        {
          id: 'operator-profile',
          label: 'Operator Profile',
          path: '/operator'
        },
        {
          id: 'operator-assignment',
          label: 'Penugasan Operator',
          path: '/penugasan-operator'
        }
      ]
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: FileText,
      submenu: [
        {
          id: 'schedule-lantai3',
          label: 'Lantai 3 Candisewu',
          path: '/schedule'
        },
        {
          id: 'schedule-lantai2',
          label: 'Lantai 2 Candisewu',
          path: '/schedule/lantai-2'
        },
        {
          id: 'schedule-lantai1',
          label: 'Lantai 1 Candisewu',
          path: '/schedule/lantai-1'
        },
        {
          id: 'schedule-sukosari',
          label: 'Workshop Sukosari',
          path: '/schedule/sukosari'
        },
        {
          id: 'schedule-tiron',
          label: 'Workshop Tiron',
          path: '/schedule/tiron'
        }
      ]
    },
    
    {
      id: 'product',
      label: 'Product',
      icon: Package,
      submenu: [
        {
          id: 'product-tracking',
          label: 'Product Tracking',
          path: '/product-tracking'
        },
        {
          id: 'product-pengerjaan-lantai3',
          label: 'Pengerjaan Lantai 3',
          path: '/product'
        },
        {
          id: 'product-pengerjaan-lantai2',
          label: 'Pengerjaan Lantai 2',
          path: '/product/lantai-2'
        },
        {
          id: 'product-pengerjaan-lantai1',
          label: 'Pengerjaan Lantai 1',
          path: '/product/lantai-1'
        },
        {
          id: 'product-pengerjaan-sukosari',
          label: 'Workshop Sukosari',
          path: '/product/sukosari'
        },
        {
          id: 'product-pengerjaan-tiron',
          label: 'Workshop Tiron',
          path: '/product/tiron'
        }
      ]
    },
    {
      id: 'project',
      label: 'Project',
      icon: ClipboardList,
      submenu: [
        {
          id: 'project-tambah-project',
          label: 'Tambahkan Project',
          path: '/project/tambah-project'
        },
        /*
        {
          id: 'project-value-stream-mapping',
          label: 'Value Stream Mapping',
          path: '/project/value-stream-mapping'
        }
          */
      ]
    },
    {
      id: 'production',
      label: 'Live Production',
      icon: Activity,
      submenu: [
        {
          id: 'production-workstation',
          label: 'Lantai 3 Candisewu',
          path: '/production-progress/timeline'
        },
        {
          id: 'production-lantai2',
          label: 'Lantai 2 Candisewu',
          path: '/production-progress/lantai-2'
        },
        {
          id: 'production-lantai1',
          label: 'Lantai 1 Candisewu',
          path: '/production-progress/lantai-1'
        },
        {
          id: 'production-sukosari',
          label: 'Workshop Sukosari',
          path: '/production-progress/sukosari'
        },
        {
          id: 'production-tiron',
          label: 'Workshop Tiron',
          path: '/production-progress/tiron'
        },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <aside 
        className={`
          ${isOpen ? 'w-64' : 'w-20'} 
          bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50
          transition-all duration-300 ease-in-out
          flex flex-col relative shadow-2xl
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50 flex items-center justify-center">
          {isOpen ? (
            <Image src="/assets/logo/logoxreka.png" alt="Andon Logo" width={200} height={60} className="object-contain" />
          ) : (
            <Image src="/assets/logo/logoxreka.png" alt="Andon Logo" width={50} height={50} className="object-contain" />
          )}
        </div>


        {/* Search Bar */}
        {/*}
        {isOpen && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}
          */}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {isOpen && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Main Menu
            </div>
          )}
          {menuItems.map((item) => (
            <MenuItemComponent 
              key={item.id} 
              item={item}
              isOpen={isOpen}
              activeMenu={activeMenu}
              expandedMenus={expandedMenus}
              onNavigate={(path) => router.push(path)}
              toggleSubmenu={toggleSubmenu}
            />
          ))}
        </nav>

{/*
          {isOpen && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-3 px-3">
              System
            </div>
          )}
          <MenuItemComponent 
            item={{ id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }}
            isOpen={isOpen}
            activeMenu={activeMenu}
            expandedMenus={expandedMenus}
            onNavigate={(path) => router.push(path)}
            toggleSubmenu={toggleSubmenu}
          />
        </nav>
*/}
        {/* Footer */}
        <div className="p-4 border-t border-gray-800/50">
          {isOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userInitials}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{userProfile.name}</p>
                  <p className="text-gray-400 text-xs">{userProfile.department}</p>
                </div>
              </div>
              <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
                <button 
                  onClick={handleNotificationClick}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-sm relative`}
                >
                  <BellRing className="w-4 h-4" />
                  Notifikasi
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full p-2 hover:bg-gray-800 rounded-lg transition-all flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
              <button className="w-full p-2 hover:bg-red-500/20 rounded-lg transition-all flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all z-50"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {children || (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Andon Dashboard</h2>
                <p className="text-gray-400">Sistem monitoring produksi enterprise</p>
              </div>

              {/* Demo Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Production Line {i}</h3>
                    <p className="text-gray-400 text-sm mb-4">Efficiency: 95% | Status: Running</p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 bg-gradient-to-r from-gray-900/70 to-gray-900/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Left: Brand & Copyright */}
              <div className="flex items-center gap-3">
                {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Activity className="w-4 h-4 text-white" />
                </div> */}
                <div className="text-center md:text-left">
                  <p className="text-gray-300 text-sm font-medium">
                    © {new Date().getFullYear()}{" "}
                    <span className="text-white font-bold">PT Rekaindo Global Jasa</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Production Intelligence Platform</p>
                </div>
              </div>

              {/* Right: Team & Status */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-gray-500 text-sm">
                  by{" "}
                  <span className="text-blue-400 font-semibold flex items-center gap-1 group">
                    Teknologi Informasi
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 hidden group-hover:inline-block animate-pulse"></span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        notifications={notifications}
        onClose={() => setIsNotificationModalOpen(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};

export default ModernSidebar;