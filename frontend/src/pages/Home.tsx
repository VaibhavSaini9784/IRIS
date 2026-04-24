import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Plus, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

const fetchStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

const fetchActivity = async () => {
  const { data } = await api.get('/activity');
  return data;
};

const Home = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 5000
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
    refetchInterval: 5000
  });

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
        {statsLoading ? (
          <div className="flex justify-center p-10"><Clock className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-success/30 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-2 rounded-lg shrink-0">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">Total Workers</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalWorkers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/30 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">Active Teams</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.activeTeams || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-success/30 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-2 rounded-lg shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">Today's Attendance</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.todayAttendance || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-warning/30 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-warning/10 p-2 rounded-lg shrink-0">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">Pending Verifications</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.pendingVerifications || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border-2 border-primary/20 h-[400px] flex flex-col">
            <CardHeader className="p-4 sm:p-6 shrink-0">
              <CardTitle className="text-primary text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0 flex-1 flex flex-col justify-center">
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
              <Link to="/reports">
                <Button className="w-full justify-start md:mt-0" variant="outline" size="lg">
                  <Clock className="mr-3 h-5 w-5" />
                  View Attendance Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-primary/20 flex flex-col h-[400px]">
            <CardHeader className="p-4 sm:p-6 shrink-0">
              <CardTitle className="text-primary text-lg sm:text-xl">Recent Activity</CardTitle>
              <CardDescription>Latest system updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 overflow-y-auto flex-1 custom-scrollbar">
              {activityLoading ? (
                <div className="flex justify-center p-6"><Clock className="animate-spin h-6 w-6 text-muted-foreground" /></div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground italic">No recent activity detected.</div>
              ) : (
                <div className="space-y-4 pr-1">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50">
                      <div className={`p-1 rounded-full mt-1 shrink-0 ${activity.type === 'success' ? 'bg-success text-success-foreground' :
                        activity.type === 'warning' ? 'bg-warning text-warning-foreground' :
                          'bg-primary text-primary-foreground'
                        }`}>
                        {activity.type === 'success' ? <CheckCircle2 size={12} /> :
                          activity.type === 'warning' ? <AlertCircle size={12} /> :
                            <Clock size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-tight">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const d = new Date(activity.time);
                            return d instanceof Date && !isNaN(d.getTime())
                              ? formatDistanceToNow(d, { addSuffix: true })
                              : "recently";
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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