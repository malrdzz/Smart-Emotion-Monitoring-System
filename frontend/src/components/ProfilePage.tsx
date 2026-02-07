import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User, Mail, GraduationCap, Edit, LogOut, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    course: '',
    gender: '',
    date_of_birth: '',
    education_level: '',
    race: ''
  });
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    course: '',
    gender: '',
    date_of_birth: '',
    education_level: '',
    race: ''
  });

  // Pagination and sorting for chat history
  const [chatPage, setChatPage] = useState(1);
  const [chatsPerPage] = useState(10);
  const [chatSortBy, setChatSortBy] = useState<'date' | 'emotion' | 'sentiment'>('date');
  const [chatSortOrder, setChatSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      // Fetch profile
      fetch("http://localhost:5000/api/profile", {
        headers: { Authorization: token },
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setEditForm(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));

      // Fetch chat logs for history
      fetch("http://localhost:5000/api/chat_logs", {
        headers: { Authorization: token },
      })
        .then(res => res.json())
        .then(data => setChatLogs(data.filter((log: any) => log.type === 'user')))
        .catch(console.error);
    }
  }, [token]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleEditSubmit = async () => {
    const res = await fetch("http://localhost:5000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: token || "" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(editForm);
      setIsEditing(false);
      alert("Profile updated!");
    } else {
      alert(data.message);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // Or navigate to login
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "DELETE",
        headers: { Authorization: token || "" },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account deleted successfully. You will be redirected.");
        logout();
        window.location.href = '/'; // Redirect to home/landing page
      } else {
        alert(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and privacy settings
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="shadow-lg lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src="https://images.unsplash.com/photo-1742093162117-7c4e94df7cb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBjYWxtJTIwcGVhY2VmdWx8ZW58MXx8fHwxNzYwODkxNzk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
                  <AvatarFallback>{profile.name ? profile.name.slice(0, 2).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription>Student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.education_level || 'State University'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Course: {profile.course || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Gender: {profile.gender || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>DOB: {profile.date_of_birth || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Race: {profile.race || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-3xl mb-1">{chatLogs.length}</div>
                  <p className="text-sm text-muted-foreground">Total Chats</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="w-4 h-4" />
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={handleDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          {isEditing && (
            <Card className="shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name">Name</label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="email">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="course">Course</label>
                    <Input
                      id="course"
                      value={editForm.course}
                      onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date_of_birth">Date of Birth</label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="education_level">Education Level</label>
                    <select
                      id="education_level"
                      value={editForm.education_level}
                      onChange={(e) => setEditForm({ ...editForm, education_level: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select education level</option>
                      <option value="Pre-School">Pre-School (Ages 4-6)</option>
                      <option value="Primary School">Primary School (Standard 1-6)</option>
                      <option value="Lower Secondary">Lower Secondary (Form 1-3)</option>
                      <option value="Upper Secondary">Upper Secondary (Form 4-5)</option>
                      <option value="STPM">STPM (Sijil Tinggi Persekolahan Malaysia)</option>
                      <option value="Matriculation">Matriculation Certificate</option>
                      <option value="Foundation">University Foundation (Asasi)</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor Degree">Bachelor Degree</option>
                      <option value="Master Degree">Master Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="race">Race/Ethnicity</label>
                    <Input
                      id="race"
                      value={editForm.race}
                      onChange={(e) => setEditForm({ ...editForm, race: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleEditSubmit}>Save Changes</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Emotion History Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chat History</CardTitle>
                <CardDescription>
                  Your chat messages with detected emotions
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Sort by:</label>
                <select
                  value={chatSortBy}
                  onChange={(e) => {
                    setChatSortBy(e.target.value as 'date' | 'emotion' | 'sentiment');
                    setChatPage(1);
                  }}
                  className="px-3 py-1 border rounded-md text-sm bg-white"
                >
                  <option value="date">Date</option>
                  <option value="emotion">Emotion</option>
                  <option value="sentiment">Sentiment</option>
                </select>
                <button
                  onClick={() => setChatSortOrder(chatSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
                >
                  {chatSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Emotion</TableHead>
                    <TableHead>Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Sort chat logs
                    const sortedLogs = [...chatLogs].sort((a, b) => {
                      if (chatSortBy === 'date') {
                        const dateCompare = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                        return chatSortOrder === 'desc' ? dateCompare : -dateCompare;
                      } else if (chatSortBy === 'emotion') {
                        const emotionCompare = (a.emotion || '').localeCompare(b.emotion || '');
                        return chatSortOrder === 'desc' ? -emotionCompare : emotionCompare;
                      } else if (chatSortBy === 'sentiment') {
                        const sentimentOrder = { 'Positive': 3, 'Neutral': 2, 'Negative': 1 };
                        const sentimentCompare = (sentimentOrder[b.sentiment as keyof typeof sentimentOrder] || 0) - (sentimentOrder[a.sentiment as keyof typeof sentimentOrder] || 0);
                        return chatSortOrder === 'desc' ? sentimentCompare : -sentimentCompare;
                      }
                      return 0;
                    });

                    // Paginate
                    const totalChatPages = Math.ceil(sortedLogs.length / chatsPerPage);
                    const startIdx = (chatPage - 1) * chatsPerPage;
                    const endIdx = startIdx + chatsPerPage;
                    const paginatedLogs = sortedLogs.slice(startIdx, endIdx);

                    return paginatedLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.content}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{log.emotion || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.sentiment === 'Positive' ? 'default' : log.sentiment === 'Negative' ? 'destructive' : 'outline'
                            }
                          >
                            {log.sentiment || 'Neutral'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const sortedLogs = [...chatLogs].sort((a, b) => {
                if (chatSortBy === 'date') {
                  const dateCompare = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                  return chatSortOrder === 'desc' ? dateCompare : -dateCompare;
                }
                return 0;
              });
              const totalChatPages = Math.ceil(sortedLogs.length / chatsPerPage);

              return totalChatPages > 1 ? (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setChatPage(Math.max(1, chatPage - 1))}
                    disabled={chatPage === 1}
                    className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {chatPage} of {totalChatPages}
                  </span>
                  <button
                    onClick={() => setChatPage(Math.min(totalChatPages, chatPage + 1))}
                    disabled={chatPage === totalChatPages}
                    className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
