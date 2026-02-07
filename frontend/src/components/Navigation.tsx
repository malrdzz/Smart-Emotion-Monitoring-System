import { Home, MessageCircle, BarChart3, User } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chatbot', label: 'Chatbot', icon: MessageCircle },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('chatbot')}
          >
            <div className="bg-primary rounded-lg p-2">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-primary font-bold">Smart Student Emotion Monitor</span>
          </div>

          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
