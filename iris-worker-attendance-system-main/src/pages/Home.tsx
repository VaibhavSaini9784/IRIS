import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Plus, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  // Mock data - replace with real API calls
  const stats = {
    totalWorkers: 156,
    activeTeams: 8,
    todayAttendance: 142,
    pendingVerifications: 14
  };

  const recentActivity = [
    { id: 1, action: 'Team Alpha marked attendance', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'New worker registered: राहुल कुमार', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'ID verification pending for 3 workers', time: '6 hours ago', type: 'warning' }
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-secondary to-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome back, {user?.name}
                </h2>
                <p className="text-muted-foreground">{user?.role} | MNREGA Portal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Today is {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-success/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Workers</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Teams</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeTeams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-success/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Attendance</p>
                  <p className="text-2xl font-bold text-foreground">{stats.todayAttendance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-warning/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-warning/10 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingVerifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/current-team">
                <Button className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground" size="lg">
                  <Users className="mr-3 h-5 w-5" />
                  View Current Teams
                </Button>
              </Link>
              <Link to="/new-work">
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <Plus className="mr-3 h-5 w-5" />
                  Create New Work Team
                </Button>
              </Link>
              <Button className="w-full justify-start" variant="outline" size="lg">
                <Clock className="mr-3 h-5 w-5" />
                View Attendance Reports
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Recent Activity</CardTitle>
              <CardDescription>Latest system updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50">
                    <div className={`p-1 rounded-full mt-1 ${
                      activity.type === 'success' ? 'bg-success text-success-foreground' :
                      activity.type === 'warning' ? 'bg-warning text-warning-foreground' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {activity.type === 'success' ? <CheckCircle2 size={12} /> :
                       activity.type === 'warning' ? <AlertCircle size={12} /> :
                       <Clock size={12} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="border border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-success text-success-foreground p-2 rounded-full">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">System Status: Online</h3>
                <p className="text-sm text-muted-foreground">
                  All services are operational. Last updated: {new Date().toLocaleTimeString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Home;