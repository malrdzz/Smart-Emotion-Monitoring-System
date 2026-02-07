import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Heart, Lightbulb, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCheckins } from "../contexts/CheckinContext";
import { useAuth } from "../contexts/AuthContext";
import React, { useEffect, useRef, useState } from 'react';

export function DashboardPage() {

  const { checkins, setAllCheckins } = useCheckins();
  const { token } = useAuth();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState<string | null>(null);

  // State for time period selection
  const [trendPeriod, setTrendPeriod] = useState<7 | 30 | 60 | 90>(30);

  // State for emotion timeline pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'emotion' | 'sentiment'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Load data when token is available
    if (token) {
      fetch("http://localhost:5000/api/checkins", {
        headers: { Authorization: token },
      })
        .then(res => res.json())
        .then(data => {
          setAllCheckins(data);
        })
        .catch(console.error);

      // Fetch AI Insight
      fetch("http://localhost:5000/api/insight", {
        headers: { Authorization: token },
      })
        .then(res => res.json())
        .then(data => {
          setAiInsight(data.insight);
          setMotivationalQuote(data.motivation);
        })
        .catch(() => {
          setAiInsight("Keep tracking your emotions to reveal patterns!");
          setMotivationalQuote("Every step forward is progress. You're doing great!");
        });
    }
  }, [token, setAllCheckins]);

  // Utilities
  const EMOTIONS = ["Anger", "Disgust", "Fear", "Joy", "Neutral", "Sadness", "Surprise"];
  const COLORS: Record<string, string> = {
    Anger: "#f87171",
    Disgust: "#a855f7",
    Fear: "#f59e0b",
    Joy: "#86efac",
    Neutral: "#d1d5db", // Light Grey for Neutral
    Sadness: "#60a5fa",
    Surprise: "#ec4899",
  };

  // Build distribution from saved checkins
  // Build distribution from saved checkins (Last 7 Days)
  const distributionMap: Record<string, number> = {};
  EMOTIONS.forEach((e) => (distributionMap[e] = 0));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  checkins
    .filter(c => new Date(c.date) >= oneWeekAgo)
    .forEach((c) => {
      const key = EMOTIONS.find((e) => c.emotion && c.emotion.toLowerCase() === e.toLowerCase()) || "Joy";
      distributionMap[key] = (distributionMap[key] || 0) + 1;
    });

  const emotionDistribution = EMOTIONS.map((name) => ({ name, value: distributionMap[name] || 0, color: COLORS[name] }));

  // --- Trend Logic ---
  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // 1. Daily View (Show trends for the most recent active day)
  const targetDate = checkins.length > 0 ? checkins[0].date : new Date().toISOString().split('T')[0];

  const emotionTrendsToday = checkins
    .filter(c => c.date === targetDate)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(c => {
      const entry: any = { time: c.time.slice(0, 5) }; // HH:MM
      EMOTIONS.forEach(e => entry[e.toLowerCase()] = 0);
      if (c.emotion) {
        entry[c.emotion.toLowerCase()] = 1;
      }
      return entry;
    });



  // If no data for today, show placeholder or empty
  if (emotionTrendsToday.length === 0) {
    // Optional: Add empty points for context or leave empty
  }


  // 2. Weekly View (Last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const trendsMapWeekly: Record<string, Record<string, number>> = {};
  last7.forEach((d) => (trendsMapWeekly[d.toISOString().split("T")[0]] = EMOTIONS.reduce((acc, e) => ({ ...acc, [e.toLowerCase()]: 0 }), {} as Record<string, number>)));

  checkins.forEach((c) => {
    const day = c.date;
    if (trendsMapWeekly[day]) {
      const eKey = (c.emotion || "").toLowerCase();
      if (eKey) trendsMapWeekly[day][eKey] = (trendsMapWeekly[day][eKey] || 0) + 1;
    }
  });

  const emotionTrendsWeekly = last7.map((d) => {
    const key = d.toISOString().split("T")[0];
    const counts = trendsMapWeekly[key] || {};
    return {
      date: formatDate(d),
      anger: counts["anger"] || 0,
      disgust: counts["disgust"] || 0,
      fear: counts["fear"] || 0,
      joy: counts["joy"] || 0,
      neutral: counts["neutral"] || 0,
      sadness: counts["sadness"] || 0,
      surprise: counts["surprise"] || 0,
    };
  });


  // 3. Monthly View (Dynamic based on trendPeriod)
  const lastN = Array.from({ length: trendPeriod }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (trendPeriod - 1 - i));
    return d;
  });
  const trendsMapMonthly: Record<string, Record<string, number>> = {};
  lastN.forEach((d) => (trendsMapMonthly[d.toISOString().split("T")[0]] = EMOTIONS.reduce((acc, e) => ({ ...acc, [e.toLowerCase()]: 0 }), {} as Record<string, number>)));

  checkins.forEach((c) => {
    const day = c.date;
    if (trendsMapMonthly[day]) {
      const eKey = (c.emotion || "").toLowerCase();
      if (eKey) trendsMapMonthly[day][eKey] = (trendsMapMonthly[day][eKey] || 0) + 1;
    }
  });

  const emotionTrendsMonthly = lastN.map((d) => {
    const key = d.toISOString().split("T")[0];
    const counts = trendsMapMonthly[key] || {};
    return {
      date: formatDate(d),
      anger: counts["anger"] || 0,
      disgust: counts["disgust"] || 0,
      fear: counts["fear"] || 0,
      joy: counts["joy"] || 0,
      neutral: counts["neutral"] || 0,
      sadness: counts["sadness"] || 0,
      surprise: counts["surprise"] || 0,
    };
  });

  // Timeline view (recent checkins with sorting and pagination)
  const sortedCheckins = [...checkins].sort((a, b) => {
    if (sortBy === 'date') {
      const dateCompare = new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
      return sortOrder === 'desc' ? dateCompare : -dateCompare;
    } else if (sortBy === 'emotion') {
      const emotionCompare = (a.emotion || '').localeCompare(b.emotion || '');
      return sortOrder === 'desc' ? -emotionCompare : emotionCompare;
    } else if (sortBy === 'sentiment') {
      const sentimentOrder = { 'Positive': 3, 'Neutral': 2, 'Negative': 1 };
      const sentimentCompare = (sentimentOrder[b.sentiment as keyof typeof sentimentOrder] || 0) - (sentimentOrder[a.sentiment as keyof typeof sentimentOrder] || 0);
      return sortOrder === 'desc' ? sentimentCompare : -sentimentCompare;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedCheckins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const emotionTimeline = sortedCheckins
    .slice(startIndex, endIndex)
    .map((c) => ({ date: new Date(c.date).toLocaleDateString(), time: c.time, emotion: c.emotion, emoji: c.emoji || "", sentiment: c.sentiment }));

  // Time-of-Day Emotion Pattern Heatmap Data
  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    return 'Night';
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(dateStr).getDay()];
  };

  // Calculate negativity score for emotions
  const getEmotionNegativity = (emotion: string) => {
    const negativityMap: Record<string, number> = {
      'Anger': 5,
      'Disgust': 4,
      'Fear': 4,
      'Sadness': 5,
      'Neutral': 2,
      'Surprise': 1,
      'Joy': 0
    };
    return negativityMap[emotion] || 0;
  };

  // Build heatmap data structure
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timePeriods = ['Morning', 'Afternoon', 'Night'];

  const heatmapData: Record<string, Record<string, { count: number; totalNegativity: number; emotions: Record<string, number> }>> = {};
  daysOfWeek.forEach(day => {
    heatmapData[day] = {};
    timePeriods.forEach(period => {
      heatmapData[day][period] = { count: 0, totalNegativity: 0, emotions: {} };
    });
  });

  checkins.forEach(c => {
    const day = getDayOfWeek(c.date);
    const timeOfDay = getTimeOfDay(c.time);
    const negativity = getEmotionNegativity(c.emotion);

    if (heatmapData[day] && heatmapData[day][timeOfDay]) {
      const cell = heatmapData[day][timeOfDay];
      cell.count++;
      cell.totalNegativity += negativity;
      cell.emotions[c.emotion] = (cell.emotions[c.emotion] || 0) + 1;
    }
  });

  // Helper to get dominant emotion
  const getDominantEmotion = (emotions: Record<string, number>) => {
    let max = 0;
    let dominant = "";
    Object.entries(emotions).forEach(([emotion, count]) => {
      if (count > max) {
        max = count;
        dominant = emotion;
      }
    });
    return dominant ? `${dominant} : ${max}` : "";
  };

  // Calculate average negativity for color mapping
  const getHeatmapColor = (day: string, period: string) => {
    const cell = heatmapData[day][period];
    if (cell.count === 0) return '#f3f4f6'; // Very light gray for no data

    const avgNegativity = cell.totalNegativity / cell.count;
    // Map negativity (0-5) to color intensity (removed light green as it's not in legend)
    if (avgNegativity >= 4) return '#dc2626'; // Dark red - high negativity
    if (avgNegativity >= 3) return '#f87171'; // Red
    if (avgNegativity >= 1) return '#d1d5db'; // Light Grey (Neutral)
    return '#22c55e'; // Green - positive
  };

  // Compute metrics
  const totalCheckins = checkins.length;
  const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
  checkins.forEach(c => {
    if (c.sentiment === 'Positive') sentimentCounts.Positive++;
    else if (c.sentiment === 'Negative') sentimentCounts.Negative++;
    else sentimentCounts.Neutral++;
  });
  const avgSentiment = totalCheckins > 0 ? (sentimentCounts.Positive * 10 + sentimentCounts.Neutral * 5) / totalCheckins : 0;

  const emotionCounts: Record<string, number> = {};
  checkins.forEach(c => {
    emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1;
  });
  const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b, "Joy");

  // Emotion emoji mapping
  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      "Joy": "😊",
      "Sadness": "😢",
      "Anger": "😠",
      "Fear": "😨",
      "Surprise": "😲",
      "Disgust": "🤢",
      "Neutral": "😐"
    };
    return emojiMap[emotion] || "😊";
  };

  // AI Insight based on data
  const generateInsight = () => {
    if (totalCheckins === 0) return "Start tracking your emotions to see insights here!";
    const positiveRatio = sentimentCounts.Positive / totalCheckins;
    if (positiveRatio > 0.7) return "You're having a great week! Keep up the positive vibes. 🌟";
    if (positiveRatio < 0.3) return "It seems like a tough week. Remember, it's okay to seek support. 💪";
    return "Your emotions are balanced. Great job maintaining emotional awareness! ⚖️";
  };
  const currentQuote = generateInsight();
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl mb-2">Emotion Dashboard</h1>
          <p className="text-muted-foreground">
            Visualize and understand your emotional patterns
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Average Sentiment</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{avgSentiment.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {totalCheckins} check-ins
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: The score represents an emotional trend derived from mapped emotion values.
              </p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>1–3: Predominantly Negative</div>
                <div>4–6: Mixed / Neutral</div>
                <div>7–10: Predominantly Positive</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-secondary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Most Frequent Emotion</CardTitle>
              <Heart className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl flex items-center gap-2">
                {getEmotionEmoji(mostFrequentEmotion)} {mostFrequentEmotion}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Detected {emotionCounts[mostFrequentEmotion] || 0} times
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Check-ins</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalCheckins}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total check-ins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Quote */}
        <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              AI-Generated Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsight ? (
              <>
                <p className="text-lg">{aiInsight}</p>
                {motivationalQuote && (
                  <div className="pt-4 border-t border-primary/20">
                    <p className="text-base italic text-muted-foreground">"{motivationalQuote}"</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground p-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating personalized insight...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emotion Trends Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Emotion Trends Over Time</CardTitle>
                <CardDescription>Track how your emotions change throughout the week</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">View:</label>
                <select
                  value={trendPeriod}
                  onChange={(e) => {
                    setTrendPeriod(Number(e.target.value) as 7 | 30 | 60 | 90);
                  }}
                  className="px-3 py-1 border rounded-md text-sm bg-white"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Custom Period</TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={emotionTrendsToday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="time" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="anger" stroke="#f87171" strokeWidth={2} name="Anger" />
                    <Line type="monotone" dataKey="disgust" stroke="#a855f7" strokeWidth={2} name="Disgust" />
                    <Line type="monotone" dataKey="fear" stroke="#f59e0b" strokeWidth={2} name="Fear" />
                    <Line type="monotone" dataKey="joy" stroke="#86efac" strokeWidth={2} name="Joy" />
                    <Line type="monotone" dataKey="neutral" stroke="#d1d5db" strokeWidth={2} name="Neutral" />
                    <Line type="monotone" dataKey="sadness" stroke="#60a5fa" strokeWidth={2} name="Sadness" />
                    <Line type="monotone" dataKey="surprise" stroke="#ec4899" strokeWidth={2} name="Surprise" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="weekly">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={emotionTrendsWeekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="anger" stroke="#f87171" strokeWidth={2} name="Anger" />
                    <Line type="monotone" dataKey="disgust" stroke="#a855f7" strokeWidth={2} name="Disgust" />
                    <Line type="monotone" dataKey="fear" stroke="#f59e0b" strokeWidth={2} name="Fear" />
                    <Line type="monotone" dataKey="joy" stroke="#86efac" strokeWidth={2} name="Joy" />
                    <Line type="monotone" dataKey="neutral" stroke="#d1d5db" strokeWidth={2} name="Neutral" />
                    <Line type="monotone" dataKey="sadness" stroke="#60a5fa" strokeWidth={2} name="Sadness" />
                    <Line type="monotone" dataKey="surprise" stroke="#ec4899" strokeWidth={2} name="Surprise" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="monthly">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={emotionTrendsMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="anger" stroke="#f87171" strokeWidth={2} name="Anger" />
                    <Line type="monotone" dataKey="disgust" stroke="#a855f7" strokeWidth={2} name="Disgust" />
                    <Line type="monotone" dataKey="fear" stroke="#f59e0b" strokeWidth={2} name="Fear" />
                    <Line type="monotone" dataKey="joy" stroke="#86efac" strokeWidth={2} name="Joy" />
                    <Line type="monotone" dataKey="neutral" stroke="#d1d5db" strokeWidth={2} name="Neutral" />
                    <Line type="monotone" dataKey="sadness" stroke="#60a5fa" strokeWidth={2} name="Sadness" />
                    <Line type="monotone" dataKey="surprise" stroke="#ec4899" strokeWidth={2} name="Surprise" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Two Column Grid: Pie Chart (Left) */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Emotion Distribution */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>Proportion of emotions detected this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emotionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {emotionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Heatmap (Right Side) */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Time-of-Day Emotion Pattern</CardTitle>
              <CardDescription>Emotion intensity by day and time (darker = more negative)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Heatmap Grid */}
                <div className="overflow-visible min-w-[600px] lg:min-w-0">
                  <div className="flex flex-col gap-2">
                    {/* Header Row */}
                    <div className="flex gap-2">
                      <div className="w-24 flex-shrink-0"></div> {/* Fixed width spacer, won't shrink */}
                      {daysOfWeek.map(day => (
                        <div key={day} className="flex-1 text-center text-sm font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Data Rows */}
                    {timePeriods.map(period => (
                      <div key={period} className="flex gap-2">
                        {/* Row Label */}
                        <div className="w-24 flex-shrink-0 flex items-center text-sm font-medium text-muted-foreground">
                          {period}
                        </div>

                        {/* Data Cells */}
                        {daysOfWeek.map(day => {
                          const cell = heatmapData[day][period];
                          const color = getHeatmapColor(day, period);
                          const hasData = cell.count > 0;
                          const dominantInfo = getDominantEmotion(cell.emotions);

                          return (
                            <div
                              key={`${day}-${period}`}
                              className="flex-1 min-w-[40px] h-16 rounded-md transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
                              style={{ backgroundColor: color }}
                              onMouseEnter={(e) => {
                                if (hasData) {
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: dominantInfo
                                  });
                                }
                              }}
                              onMouseMove={(e) => {
                                if (hasData) {
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: dominantInfo
                                  });
                                }
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Emotion Intensity:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                    <span className="text-xs text-muted-foreground">Positive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: '#d1d5db' }}></div>
                    <span className="text-xs text-muted-foreground">Neutral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f87171' }}></div>
                    <span className="text-xs text-muted-foreground">Negative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                    <span className="text-xs text-muted-foreground">Very Negative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: '#f3f4f6' }}></div>
                    <span className="text-xs text-muted-foreground">No Data</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emotion Timeline */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Emotion Timeline</CardTitle>
                <CardDescription>Your latest emotional check-ins (Page {currentPage} of {totalPages})</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'date' | 'emotion' | 'sentiment');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border rounded-md text-sm bg-white"
                >
                  <option value="date">Date</option>
                  <option value="emotion">Emotion</option>
                  <option value="sentiment">Sentiment</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emotionTimeline.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{entry.emoji}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{entry.emotion}</span>
                        <Badge
                          variant={
                            entry.sentiment === 'Positive' ? 'default' :
                              entry.sentiment === 'Negative' ? 'destructive' :
                                'outline'
                          }
                          className="text-xs"
                        >
                          {entry.sentiment}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} at {entry.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
