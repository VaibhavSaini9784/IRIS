import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, CheckCircle2, User, Building, Fingerprint, ShieldAlert, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

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
  const { data } = await axios.get('http://localhost:4000/api/reports');
  return data;
};

const Reports = () => {
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
    refetchInterval: 5000 // auto-refresh every 5s
  });

  return (
    <Layout title="Attendance Reports">
      <div className="space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Real-Time Verification Logs
            </CardTitle>
            <CardDescription>
              Detailed history of all Iris verification attempts across all active teams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex justify-center p-10"><Clock className="animate-spin h-8 w-8 text-primary" /></div>
            ) : error ? (
               <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center">
                 <ShieldAlert className="h-5 w-5 mr-2" /> Failed to load reports.
               </div>
            ) : reports.length === 0 ? (
               <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                 <p>No attendance logs found yet. Start an attendance session!</p>
               </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Worker ID</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Match Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((log) => {
                      const logDate = new Date(log.date);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {logDate.toLocaleDateString()} <span className="text-muted-foreground ml-1">{logDate.toLocaleTimeString()}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="font-medium">{log.workerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Fingerprint className="h-4 w-4 mr-2" />
                              {log.aadhaarId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              {log.teamName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.status === 'present' ? (
                              <Badge variant="default" className="bg-success text-success-foreground hover:bg-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified Present
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" /> Failed Verification
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                               <div className="text-sm font-medium">
                                 Class: {log.matchedPerson}
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 Confidence: {(log.confidence * 100).toFixed(1)}%
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
