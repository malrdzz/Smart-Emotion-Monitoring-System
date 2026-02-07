import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MessageCircle, Brain, BarChart3, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const features = [
    {
      icon: MessageCircle,
      title: 'Chatbot & Journaling',
      description: 'Express your feelings through an AI-powered chatbot that listens and understands.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Brain,
      title: 'Sentiment & Emotion Engine',
      description: 'Advanced AI analyzes your emotions and provides insights into your emotional patterns.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Visualization',
      description: 'Track your emotional journey with beautiful charts and interactive visualizations.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Shield,
      title: 'Secure Data Storage',
      description: 'Your emotional data is encrypted and stored securely with complete privacy controls.',
      color: 'bg-teal-100 text-teal-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Enhanced Design */}
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">
                Smart Student Emotion Monitoring System
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4 md:gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="hidden md:block text-gray-700 hover:text-primary transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hidden md:block text-gray-700 hover:text-primary transition-colors font-medium"
              >
                About
              </button>
              <Button onClick={onGetStarted} className="gap-2 bg-gradient-to-r from-primary to-purple-600 shadow-lg hover:shadow-xl">
                Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Emotion Tracking</span>
              </div>
              <h1 className="text-5xl lg:text-6xl">
                Track your emotions.{' '}
                <span className="text-primary">Understand your feelings.</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                A safe and supportive platform designed specifically for university students to monitor,
                understand, and improve their emotional well-being through AI-powered tools and visualizations.
              </p>
              <div className="flex gap-4 pt-4">
                <Button onClick={onGetStarted} size="lg" className="gap-2 bg-gradient-to-r from-primary to-purple-600 shadow-lg hover:shadow-xl">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => scrollToSection('features')}
                >
                  <Sparkles className="w-4 h-4" />
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1725798451557-fc60db3eb6a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGF0Ym90JTIwaW50ZXJmYWNlJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc2MDg5MTc5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Chatbot Illustration"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Main Features</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to understand and improve your emotional well-being
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section - Consolidated */}
      <section id="about" className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-4xl font-bold">About EmotionTrack</h2>
            <p className="text-muted-foreground text-lg">
              Our Smart Student Emotion Monitoring System uses advanced AI technology to help you
              understand and manage your emotions better. Simply chat with our AI assistant, track
              your feelings over time, and receive personalized insights and motivational support
              to improve your mental well-being.
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Express Your Feelings</h4>
                  <p className="text-muted-foreground">
                    Chat with our AI-powered assistant that listens, understands, and provides empathetic support tailored to your emotional state.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #a855f7, #ec4899)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Track Your Patterns</h4>
                  <p className="text-muted-foreground">
                    Our advanced emotion detection engine analyzes your feelings and creates beautiful visualizations of your emotional journey over time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #22c55e, #10b981)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Gain Insights & Grow</h4>
                  <p className="text-muted-foreground">
                    Receive personalized insights, motivational quotes, and actionable recommendations to improve your emotional well-being and mental health.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6 bg-gradient-to-r from-primary to-purple-600 text-white rounded-3xl p-12 shadow-xl">
            <h2 className="text-4xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-white text-lg">
              Join thousands of students who are taking control of their emotional well-being
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              variant="secondary"
              className="gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
