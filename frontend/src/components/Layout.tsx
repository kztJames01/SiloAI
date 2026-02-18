import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Zap,
  User,
  HelpCircle,
  CreditCard,
  Plus,
  Home,
  LayoutGrid,
  Globe,
  Workflow,
  Shield,
  Play,
  LogOut,
  MoreHorizontal,
  Brain,
  Plug,
} from 'lucide-react';
import { useUiStore, useAuthStore } from '../lib/store';

const sidebarNavItems = [
  { id: 'home', icon: Home, label: 'Home', href: '/workflows' },
  { id: 'templates', icon: LayoutGrid, label: 'Templates', href: '/templates' },
  { id: 'apps', icon: Globe, label: 'Apps', href: '/#discover-apps' },
];

const mainNavItems = [
  { id: 'workflows', icon: Workflow, label: 'Workflows', href: '/workflows' },
  { id: 'safety', icon: Shield, label: 'Safety', href: '/safety' },
  { id: 'executions', icon: Play, label: 'Executions', href: '/executions' },
  { id: 'integrations', icon: Plug, label: 'Integrations', href: '/integrations' },
  { id: 'ai-settings', icon: Brain, label: 'AI Settings', href: '/ai-settings' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Zapier-style Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-80' : 'w-20'
        }`}
      >
        {/* Top Section - Create Button */}
        <div className="p-4">
          <Link
            to="/workflows/new"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-4 font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            {sidebarOpen && <span>Create</span>}
          </Link>
        </div>

        {/* Quick Navigation */}
        <nav className="px-4 space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            // Check for active state: exact match for templates, /workflows for home, or hash links
            const isActive = 
              (item.id === 'home' && location.pathname === '/workflows') ||
              (item.id === 'templates' && location.pathname === '/templates') ||
              (item.href.startsWith('/#') && location.pathname === '/workflows' && location.hash === item.href.substring(1));
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200" />

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer - More and Logout */}
        <div className="border-t border-gray-200 p-4 space-y-1">
          <button
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full"
          >
            <MoreHorizontal className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">More</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-80' : 'ml-20'
        }`}
      >
        {/* Header - Floats above sidebar */}
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left: Menu Button + Logo */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <Link to="/" className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Silo</span>
                </Link>
              </div>

              {/* Right: Help, Upgrade, Profile */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
                  <CreditCard className="h-4 w-4" />
                  <span>Upgrade</span>
                </button>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Add top padding for fixed header */}
        <main className="bg-gray-50 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
