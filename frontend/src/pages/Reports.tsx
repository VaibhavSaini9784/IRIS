import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Clock, CheckCircle2, User, Building, Fingerprint, ShieldAlert,
  XCircle, Search, Filter, Download, RefreshCw, Calendar,
  TrendingUp, Users, BarChart3, AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatDistanceToNow } from 'date-fns';

interface ReportEntry {
  id: string;
  date: string;
  workerName: string;
  aadhaarId: string;
  teamName: string;
  status: string;
  confidence: number;
  matchedPerson: string;
}

const fetchReports = async (): Promise<ReportEntry[]> => {
  const { data } = await api.get('/reports');
  return data;
};

// Group entries by date
const groupByDate = (entries: ReportEntry[]) => {
  const groups: Record<string, ReportEntry[]> = {};
  entries.forEach(entry => {
    const day = new Date(entry.date).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(entry);
  });
  return groups;
};

// Export to CSV
const exportCSV = (data: ReportEntry[]) => {
  const headers = ['Date', 'Time', 'Worker Name', 'Aadhaar ID', 'Team', 'Status', 'AI Confidence', 'Matched Person'];
  const rows = data.map(r => {
    const d = new Date(r.date);
    return [
      d.toLocaleDateString('en-IN'),
      d.toLocaleTimeString('en-IN'),
      r.workerName,
      r.aadhaarId,
      r.teamName,
      r.status,
      `${(r.confidence * 100).toFixed(1)}%`,
      r.matchedPerson
    ];
  });
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [view, setView] = useState<'grouped' | 'flat'>('grouped');

  const { data: reports = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    refetchInterval: 10000
  });

  // Derived stats
  const stats = useMemo(() => {
    const total = reports.length;
    const present = reports.filter(r => r.status === 'present').length;
    const failed = total - present;
    const avgConf = total > 0 ? reports.reduce((acc, r) => acc + r.confidence, 0) / total : 0;
    const teams = [...new Set(reports.map(r => r.teamName))];
    return { total, present, failed, avgConf, teams };
  }, [reports]);

  // All unique teams for filter dropdown
  const allTeams = useMemo(() => [...new Set(reports.map(r => r.teamName))], [reports]);

  // Get unique dates
  const allDates = useMemo(() => {
    return [...new Set(reports.map(r =>
      new Date(r.date).toLocaleDateString('en-IN')
    ))];
  }, [reports]);

  // Filtered reports
  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = !search ||
        r.workerName.toLowerCase().includes(search.toLowerCase()) ||
        r.aadhaarId.toLowerCase().includes(search.toLowerCase()) ||
        r.teamName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchTeam = teamFilter === 'all' || r.teamName === teamFilter;

      const rDate = new Date(r.date).toLocaleDateString('en-IN');
      const matchDate = dateFilter === 'all' || rDate === dateFilter;

      return matchSearch && matchStatus && matchTeam && matchDate;
    });
  }, [reports, search, statusFilter, teamFilter, dateFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const groupedDays = Object.keys(grouped).sort((a, b) =>
    new Date(grouped[b][0].date).getTime() - new Date(grouped[a][0].date).getTime()
  );

  return (
    <Layout title="Attendance Reports">
      <div className="space-y-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-success/30 bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Present</p>
                <p className="text-2xl font-bold text-success">{stats.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-destructive/10 p-2 rounded-lg"><XCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Failed Verifications</p>
                <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. AI Confidence</p>
                <p className="text-2xl font-bold text-primary">{(stats.avgConf * 100).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg"><Users className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Worker name, ID, team..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-[140px] space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">✅ Present</SelectItem>
                    <SelectItem value="absent">❌ Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Filter */}
              <div className="min-w-[160px] space-y-1">
                <Label className="text-xs text-muted-foreground">Team</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {allTeams.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="min-w-[160px] space-y-1">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {allDates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="min-w-[140px] space-y-1">
                <Label className="text-xs text-muted-foreground">View</Label>
                <Select value={view} onValueChange={(v: any) => setView(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grouped">📅 Grouped by Day</SelectItem>
                    <SelectItem value="flat">📋 Flat List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-auto pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => exportCSV(filtered)}
                  disabled={filtered.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {filtered.length !== reports.length && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing <strong>{filtered.length}</strong> of {reports.length} records
                {search && ` • search: "${search}"`}
                {statusFilter !== 'all' && ` • status: ${statusFilter}`}
                {teamFilter !== 'all' && ` • team: ${teamFilter}`}
                {dateFilter !== 'all' && ` • date: ${dateFilter}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-primary flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5" />
              Verification Logs
              {isFetching && <RefreshCw className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>Live attendance data — auto-refreshes every 10 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16 gap-3">
                <RefreshCw className="animate-spin h-8 w-8 text-primary" />
                <p className="text-muted-foreground text-sm">Loading attendance records...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Failed to load reports</p>
                  <p className="text-sm opacity-80">Please check the backend server is running.</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed rounded-lg text-muted-foreground">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No records found</p>
                <p className="text-sm">Try adjusting your filters or start marking attendance.</p>
              </div>
            ) : view === 'grouped' ? (
              // GROUPED VIEW — Day by Day
              <div className="space-y-6">
                {groupedDays.map(day => {
                  const dayEntries = grouped[day];
                  const dayPresent = dayEntries.filter(e => e.status === 'present').length;
                  return (
                    <div key={day}>
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-foreground">{day}</span>
                          <Badge variant="outline" className="text-xs ml-1">
                            {dayEntries.length} record{dayEntries.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-success/10 text-success border-success/30">
                            ✅ {dayPresent} present
                          </Badge>
                          {dayEntries.length - dayPresent > 0 && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                              ❌ {dayEntries.length - dayPresent} failed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Day Table */}
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-[120px]">Time</TableHead>
                              <TableHead>Worker</TableHead>
                              <TableHead>Aadhaar ID</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">AI Confidence</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayEntries
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(log => (
                                <TableRow key={log.id} className="hover:bg-muted/20">
                                  <TableCell className="font-mono text-sm whitespace-nowrap text-muted-foreground">
                                    {new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {log.workerName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium">{log.workerName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground font-mono">
                                    {log.aadhaarId}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Building className="h-3 w-3 text-muted-foreground" />
                                      {log.teamName}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {log.status === 'present' ? (
                                      <Badge className="bg-success/10 text-success border border-success/30 hover:bg-success/20">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Present
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-destructive/10 text-destructive border border-destructive/30">
                                        <XCircle className="h-3 w-3 mr-1" /> Failed
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                      <span className={`text-sm font-bold ${log.confidence >= 0.85 ? 'text-success' : log.confidence >= 0.70 ? 'text-warning' : 'text-destructive'}`}>
                                        {(log.confidence * 100).toFixed(1)}%
                                      </span>
                                      <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                                        <div
                                          className={`h-1.5 rounded-full ${log.confidence >= 0.85 ? 'bg-success' : log.confidence >= 0.70 ? 'bg-warning' : 'bg-destructive'}`}
                                          style={{ width: `${Math.min(log.confidence * 100, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // FLAT VIEW
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Aadhaar ID</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">AI Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(log => {
                        const d = new Date(log.date);
                        return (
                          <TableRow key={log.id} className="hover:bg-muted/20">
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm font-medium">{d.toLocaleDateString('en-IN')}</div>
                              <div className="text-xs text-muted-foreground font-mono">{d.toLocaleTimeString('en-IN')}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {log.workerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{log.workerName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">{log.aadhaarId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {log.teamName}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.status === 'present' ? (
                                <Badge className="bg-success/10 text-success border border-success/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Present
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/10 text-destructive border border-destructive/30">
                                  <XCircle className="h-3 w-3 mr-1" /> Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className={`text-sm font-bold ${log.confidence >= 0.85 ? 'text-success' : log.confidence >= 0.70 ? 'text-warning' : 'text-destructive'}`}>
                                  {(log.confidence * 100).toFixed(1)}%
                                </span>
                                <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full ${log.confidence >= 0.85 ? 'bg-success' : log.confidence >= 0.70 ? 'bg-warning' : 'bg-destructive'}`}
                                    style={{ width: `${Math.min(log.confidence * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
