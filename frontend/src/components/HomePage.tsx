import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MessageCircle, BarChart3, User, Heart, TrendingUp, Calendar, Sparkles, Zap, Target, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
    onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
    const { user } = useAuth();

    const quickActions = [
        {
            id: 'chatbot',
            title: 'Start Chatting',
            description: 'Talk to your AI companion and express your feelings',
            icon: MessageCircle,
            gradient: 'from-blue-500 to-cyan-500',
            action: () => onNavigate('chatbot'),
        },
        {
            id: 'dashboard',
            title: 'View Dashboard',
            description: 'Track your emotional trends and insights',
            icon: BarChart3,
            gradient: 'from-purple-500 to-pink-500',
            action: () => onNavigate('dashboard'),
        },
        {
            id: 'profile',
            title: 'Manage Profile',
            description: 'Update your information and view chat history',
            icon: User,
            gradient: 'from-green-500 to-emerald-500',
            action: () => onNavigate('profile'),
        },
    ];

    const stats = [
        {
            icon: Zap,
            label: 'AI-Powered',
            value: 'Real-time emotion analysis',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
        {
            icon: Target,
            label: 'Personalized',
            value: 'Tailored insights for you',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            icon: Award,
            label: 'Secure',
            value: 'Your data is protected',
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section */}
                <div className="mb-12">
                    <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Heart className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-bold text-primary">
                                    Welcome back, {user?.name || 'Friend'}!
                                </h1>
                                <p className="text-gray-600 text-xl mt-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    How are you feeling today?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                                        <p className="text-sm font-medium text-gray-800">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="w-8 h-8 text-primary" />
                        Quick Actions
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Card
                                    key={action.id}
                                    className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary bg-white"
                                >
                                    <CardHeader>
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                            <Icon className="w-8 h-8 text-black" />
                                        </div>
                                        <CardTitle className="text-2xl text-gray-900">{action.title}</CardTitle>
                                        <CardDescription className="text-base text-gray-8">{action.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={action.action}
                                            className={`w-full bg-gradient-to-r ${action.gradient} text-black border-0 shadow-lg hover:shadow-xl transition-all`}
                                        >
                                            Get Started →
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Features Overview */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Daily Tip */}
                    <Card className="shadow-lg border-2 bg-white hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <CardTitle className="text-xl">Daily Wellness Tip</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 leading-relaxed">
                                Taking a few minutes each day to check in with your emotions can help you better understand
                                your mental well-being. Try journaling your feelings or talking to our AI chatbot to process
                                your thoughts.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="shadow-lg border-2 bg-white hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-black" />
                                </div>
                                <CardTitle className="text-xl">Your Progress</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Track your emotional journey and see how you've grown over time. Visit your dashboard
                                to view detailed insights and trends.
                            </p>
                            <Button
                                onClick={() => onNavigate('dashboard')}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-black shadow-lg hover:shadow-xl"
                            >
                                View Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Getting Started Guide */}
                <Card className="mt-8 shadow-lg bg-white border-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Getting Started</CardTitle>
                        </div>
                        <CardDescription className="text-base">Make the most of your emotional wellness journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Start a Conversation</h4>
                                    <p className="text-sm text-gray-600">
                                        Chat with our AI to express your feelings and get personalized support
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #a855f7, #ec4899)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Track Your Emotions</h4>
                                    <p className="text-sm text-gray-600">
                                        Monitor your emotional patterns through our interactive dashboard
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #22c55e, #10b981)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Review Your Progress</h4>
                                    <p className="text-sm text-gray-600">
                                        Check your profile to see your chat history and emotional journey
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
