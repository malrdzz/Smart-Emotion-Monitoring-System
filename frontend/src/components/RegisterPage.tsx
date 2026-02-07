import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserPlus, Mail, Lock, User, Users, GraduationCap, Calendar, BookOpen } from "lucide-react";

interface RegisterPageProps {
  onGoLogin: () => void;
  onBackToLanding?: () => void;
}

export function RegisterPage({ onGoLogin, onBackToLanding }: RegisterPageProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    course: "",
    gender: "",
    date_of_birth: "",
    education_level: "",
    race: "",
  });

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (!form.course.trim()) return "Course/Program is required";
    if (!form.gender.trim()) return "Gender is required";
    if (!form.date_of_birth.trim()) return "Date of birth is required";
    if (!form.education_level.trim()) return "Education level is required";
    if (!form.race.trim()) return "Race/Ethnicity is required";
    if (!form.email.includes("@")) return "Please enter a valid email";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Register successful");
      onGoLogin(); // 🔁 go back to login page
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join our community to start tracking your emotional well-being
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Course/Program
            </Label>
            <Input
              id="course"
              placeholder="Enter your course or program"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Gender
            </Label>
            <select
              id="gender"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education_level" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Education Level
            </Label>
            <select
              id="education_level"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={form.education_level}
              onChange={(e) => setForm({ ...form, education_level: e.target.value })}
            >
              <option value="">Select education level</option>
              <option value="Lower Secondary">Lower Secondary (Form 1-3)</option>
              <option value="Upper Secondary">Upper Secondary (Form 4-5)</option>
              <option value="STPM">STPM (Sijil Tinggi Persekolahan Malaysia)</option>
              <option value="Matriculation">Matriculation Certificate</option>
              <option value="Foundation">University Foundation (Asasi)</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor Degree">Bachelor Degree</option>
              <option value="Master Degree">Master Degree</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="race" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Race/Ethnicity
            </Label>
            <select
              id="race"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={form.race}
              onChange={(e) => setForm({ ...form, race: e.target.value })}
            >
              <option value="">Select race/ethnicity</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Bumiputera">Bumiputera</option>

            </select>
          </div>

          <Button onClick={handleRegister} className="w-full" size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={onGoLogin}>
                Sign in here
              </Button>
            </p>
            {onBackToLanding && (
              <Button variant="ghost" className="w-full" onClick={onBackToLanding}>
                ← Back to Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
