import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  HelpCircle,
  CreditCard,
  Plus,
  Home,
  LayoutGrid,
  Globe,
  Workflow,
  Shield,
  Database,
  LogOut,
  MoreHorizontal,
  Plug,
  Bot,
  Sun,
  Moon,
} from 'lucide-react';
import { useUiStore, useAuthStore } from '../lib/store';
import { BrandLogo } from './BrandLogo';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, isDark, toggleDark } = useUiStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border flex flex-col transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-80' : 'w-30'
        }`}
      >
        {/* Create Button */}
        <div className="p-4">
          <Link
            to="/workflows/new"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-3 px-4 font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            {sidebarOpen && <span>Create</span>}
          </Link>
        </div>

        {/* Quick Navigation */}
        <nav className="px-4 space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.id === 'home' && location.pathname === '/') ||
              (item.href.startsWith('/#') && location.pathname === '/' && location.hash === item.href.substring(1));
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-border" />

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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full">
            <MoreHorizontal className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">More</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-20'}`}>
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left: Menu + Logo */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <Link to="/" className="flex items-center space-x-2">
                  <BrandLogo
                    className="flex items-center gap-2"
                    imageClassName="h-9 w-auto"
                    showText
                    textClassName="text-xl font-bold text-foreground dark:text-yellow-300"
                  />
                </Link>
              </div>

              {/* Right: Dark toggle, Help, Upgrade, Profile */}
              <div className="flex items-center space-x-2">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleDark}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <Link to="/help" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Link>
                <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <CreditCard className="h-4 w-4" />
                  <span>Upgrade</span>
                </button>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


const sidebarNavItems = [
  { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
  { id: 'org', icon: Globe, label: 'Organizations', href: '/orgs' },
];

const mainNavItems = [
  { id: 'workflows', icon: Workflow, label: 'Workflows', href: '/workflows' },
  { id: 'agents', icon: Bot, label: 'AI Agents', href: '/agents' },
  { id: 'templates', icon: LayoutGrid, label: 'Templates', href: '/templates' },
  { id: 'safety', icon: Shield, label: 'Safety', href: '/safety' },
  { id: 'data-storage', icon: Database, label: 'Data Storage', href: '/data-storage' },
  { id: 'integrations', icon: Plug, label: 'Integrations', href: '/integrations' },
];
