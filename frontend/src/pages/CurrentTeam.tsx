import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Users, Scan, CheckCircle2, XCircle, Clock, UserCheck, Camera, Upload, Eye, Trash2, Edit, Save, MoreVertical, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import api from '../lib/api';

interface Worker {
  _id: string;
  id?: string;
  name: string;
  aadhaarId: string;
  status: 'present' | 'absent' | 'pending';
  lastAttendance?: string;
  irisClassLabel: string;
  shifts?: number[];
}

interface Team {
  id: string;
  name: string;
  location: string;
  workers: Worker[];
  supervisor: string;
}

const CurrentTeam = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const [irisVerificationStatus, setIrisVerificationStatus] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
  const [irisScanMode, setIrisScanMode] = useState<'capture' | 'upload'>('capture');
  const [detectedPerson, setDetectedPerson] = useState<string | null>(null);

  const irisVideoRef = useRef<HTMLVideoElement | null>(null);
  const irisStreamRef = useRef<MediaStream | null>(null);
  const [irisLiveActive, setIrisLiveActive] = useState(false);
  const [capturedIrisImage, setCapturedIrisImage] = useState<string | null>(null);
  const [uploadedIrisImage, setUploadedIrisImage] = useState<string | null>(null);

  // Worker CRUD State
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', aadhaarId: '', irisClassLabel: '' });

  // Get ML Labels for Select
  const { data: mlLabels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const res = await api.get('/labels');
      return res.data.labels as string[];
    }
  });

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;
  const selectedWorker = selectedTeam?.workers.find(w => w._id === selectedWorkerId || (w as any).id === selectedWorkerId) || null;

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      setSelectedTeamId(null);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Team Deleted', description: 'The team has been removed.' });
    }
  });

  const addWorkerMutation = useMutation({
    mutationFn: async ({ teamId, worker }: { teamId: string; worker: any }) => {
      await api.post(`/teams/${teamId}/workers`, worker);
    },
    onSuccess: () => {
      setIsAddingWorker(false);
      setWorkerForm({ name: '', aadhaarId: '', irisClassLabel: '' });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Worker Added', description: 'Worker has been added to team.' });
    }
  });

  const updateWorkerMutation = useMutation({
    mutationFn: async ({ teamId, workerId, worker }: { teamId: string; workerId: string; worker: any }) => {
      await api.put(`/teams/${teamId}/workers/${workerId}`, worker);
    },
    onSuccess: () => {
      setEditingWorker(null);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Worker Updated', description: 'Worker details updated.' });
    }
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: async ({ teamId, workerId }: { teamId: string; workerId: string }) => {
      await api.delete(`/teams/${teamId}/workers/${workerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Worker Removed', description: 'Worker removed from team.' });
    }
  });



  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      irisStreamRef.current = stream;
      if (irisVideoRef.current) {
        irisVideoRef.current.srcObject = stream;
        await irisVideoRef.current.play();
      }
      setIrisLiveActive(true);
    } catch (err) {
      toast({ title: 'Camera access denied', description: 'Please allow camera permissions to proceed.', variant: 'destructive' });
    }
  };

  const stopStream = () => {
    if (irisStreamRef.current) {
      irisStreamRef.current.getTracks().forEach((t) => t.stop());
      irisStreamRef.current = null;
      setIrisLiveActive(false);
    }
  };

  const captureFrame = () => {
    if (!irisVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = irisVideoRef.current.videoWidth || 640;
    canvas.height = irisVideoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(irisVideoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedIrisImage(canvas.toDataURL('image/png'));
  };

  const getActiveIrisImage = () => {
    return irisScanMode === 'capture' ? capturedIrisImage : uploadedIrisImage;
  };

  // const handleIrisVerify = async () => {
  //   const irisImageBase64 = getActiveIrisImage();
  //   if (!irisImageBase64) {
  //     toast({ title: 'Capture iris first', description: 'Please capture iris image to verify.', variant: 'destructive' });
  //     return;
  //   }

  //   if (!selectedWorker) return;

  //   setIrisVerificationStatus('scanning');
  //   setDetectedPerson(null);

  //   // try {
  //   //   const res = await fetch(irisImageBase64);
  //   //   const blob = await res.blob();
  //   //   const formData = new FormData();
  //   //   formData.append('image', blob, 'iris.png');

  //   //   const response = await fetch('http://localhost:5000/predict', {
  //   //     method: 'POST',
  //   //     body: formData,
  //   //   });

  //   //   const data = await response.json();
  //   //   if (!response.ok) throw new Error(data.error || 'AI verification failed');

  //   //   if (data.person === "Unknown") {
  //   //     setIrisVerificationStatus('failed');
  //   //     toast({ title: 'Person Unknown', description: 'Identity could not be verified. Please try again.', variant: 'destructive' });
  //   //   } else if (data.person !== selectedWorker.irisClassLabel) {
  //   //     setIrisVerificationStatus('failed');
  //   //     setDetectedPerson(data.person);
  //   //     toast({
  //   //       title: 'Identity Mismatch',
  //   //       description: `Detected ${data.person}, but you selected ${selectedWorker.name}. Access Denied.`,
  //   //       variant: 'destructive'
  //   //     });
  //   //   } else {
  //   //     setIrisVerificationStatus('matched');
  //   //     setDetectedPerson(data.person);
  //   //     toast({ title: 'Verification Success', description: `Identity confirmed as ${data.person}.` });
  //   //   }
  //   // } catch (error: any) {
  //   //   setIrisVerificationStatus('failed');
  //   //   toast({ title: 'Error', description: error.message, variant: 'destructive' });
  //   // }
  //   try {
  //     const formData = new FormData();

  //     // 🔥 IMPORTANT CHANGE
  //     formData.append('person', selectedWorker.irisClassLabel);

  //     const response = await fetch('http://localhost:5000/predict', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const data = await response.json();
  //     if (!response.ok) throw new Error(data.error || 'AI verification failed');

  //     if (data.predicted === "Unknown") {
  //       setIrisVerificationStatus('failed');
  //       toast({
  //         title: 'Person Unknown',
  //         description: 'Identity could not be verified.',
  //         variant: 'destructive'
  //       });

  //     } else if (data.predicted !== selectedWorker.irisClassLabel) {
  //       setIrisVerificationStatus('failed');
  //       setDetectedPerson(data.predicted);

  //       toast({
  //         title: 'Identity Mismatch',
  //         description: `Detected ${data.predicted}, but selected ${selectedWorker.name}`,
  //         variant: 'destructive'
  //       });

  //     } else {
  //       setIrisVerificationStatus('matched');
  //       setDetectedPerson(data.predicted);

  //       toast({
  //         title: 'Verification Success',
  //         description: `Identity confirmed as ${data.predicted}`
  //       });
  //     }

  //   } catch (error) {
  //     setIrisVerificationStatus('failed');
  //     toast({
  //       title: 'Error',
  //       description: error.message,
  //       variant: 'destructive'
  //     });
  //   }
  // };

  const resetVerificationState = () => {
    setIrisVerificationStatus('idle');
    setIrisScanMode('capture');
    setCapturedIrisImage(null);
    setUploadedIrisImage(null);
    setDetectedPerson(null);
    stopStream();
  };

  const handleIrisVerify = async () => {
    const irisImageBase64 = getActiveIrisImage();

    if (!irisImageBase64) {
      toast({
        title: 'Capture iris first',
        description: 'Please capture iris image to verify.',
        variant: 'destructive'
      });
      return;
    }

    // 🔥 STRICT CHECK
    if (!selectedWorker || !selectedWorker.irisClassLabel) {
      console.error("❌ Worker not selected properly:", selectedWorker);

      toast({
        title: 'No person selected',
        description: 'Please select a worker before verification.',
        variant: 'destructive'
      });

      return;
    }

    console.log("✅ Sending person:", selectedWorker.irisClassLabel);

    setIrisVerificationStatus('scanning');
    setDetectedPerson(null);

    try {
      const formData = new FormData();
      formData.append('person', selectedWorker.irisClassLabel);

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log("📦 Backend Response:", data);

      if (!response.ok) throw new Error(data.error || 'AI verification failed');

      if (data.predicted === "Unknown") {
        setIrisVerificationStatus('failed');

        toast({
          title: 'Person Unknown',
          description: 'Identity could not be verified.',
          variant: 'destructive'
        });

      } else if (data.predicted !== selectedWorker.irisClassLabel) {
        setIrisVerificationStatus('failed');
        setDetectedPerson(data.predicted);

        toast({
          title: 'Identity Mismatch',
          description: `Detected ${data.predicted}, but selected ${selectedWorker.name}`,
          variant: 'destructive'
        });

      } else {
        setIrisVerificationStatus('matched');
        setDetectedPerson(data.predicted);

        toast({
          title: 'Verification Success',
          description: `Identity confirmed as ${data.predicted}`
        });
      }

    } catch (error) {
      console.error("❌ Error:", error);

      setIrisVerificationStatus('failed');

      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    resetVerificationState();
  }, [selectedWorker]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      const irisImage = getActiveIrisImage();
      if (!irisImage) throw new Error("No image captured or uploaded");
      if (!selectedTeam || !selectedWorker) throw new Error("Team or Worker not selected");

      const res = await fetch(irisImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('image', blob, 'iris.png');
      formData.append('teamId', selectedTeamId || '');
      formData.append('workerId', selectedWorker?._id || (selectedWorker as any)?.id || '');
      formData.append('person', selectedWorker?.irisClassLabel || '');

      const response = await fetch('http://localhost:4000/api/mark-attendance', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Operation failed');
      return data;
    },
    onSuccess: (data) => {
      const finishedWorkerId = selectedWorker?._id;
      const finishedTeamId = selectedTeam?.id;

      resetVerificationState();
      setSelectedWorkerId(null);

      toast({
        title: 'Attendance Verified ✅',
        description: `Successfully recorded attendance for ${data.person}.`,
      });

      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast({ title: 'Final Save Failed', description: error.message, variant: 'destructive' });
    }
  });

  const markAttendance = () => {
    if (!selectedWorker || !selectedTeam) return;
    if (irisVerificationStatus !== 'matched') {
      toast({ title: 'Verification incomplete', description: 'Identity must match selected worker before marking.', variant: 'destructive' });
      return;
    }

    markAttendanceMutation.mutate();
  };

  const getStatusBadge = (worker: Worker) => {
    if (worker.status === 'present') {
      return <Badge className="bg-success text-success-foreground">Completed (3/3)</Badge>;
    } else if (worker.shifts && worker.shifts.length > 0) {
      return <Badge className="bg-warning text-warning-foreground text-yellow-800">Marked ({worker.shifts.length}/3)</Badge>;
    } else {
      return <Badge variant="secondary">Pending (0/3)</Badge>;
    }
  };

  return (
    <Layout title="Current Teams">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-10">Loading teams...</div>
        ) : !selectedTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
                <Card key={team.id} className="border-2 border-primary/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTeamId(team.id)}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                      <Users size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-primary">{team.name}</CardTitle>
                      <CardDescription>{team.location}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Supervisor:</strong> {team.supervisor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Workers:</strong> {team.workers.length}
                    </p>
                    <div className="flex space-x-2">
                      <span className="text-xs">
                        Present: {team.workers.filter(w => w.status === 'present').length}
                      </span>
                      <span className="text-xs">
                        Pending: {team.workers.filter(w => w.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      View Team Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Permanently delete team: ${team.name}?`)) {
                          deleteTeamMutation.mutate(team.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Team Details & Attendance
          <div className="space-y-6">
            {/* Team Header */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-secondary to-accent">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg flex-shrink-0">
                      <Users size={24} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl text-primary truncate">{selectedTeam.name}</CardTitle>
                      <CardDescription className="text-sm sm:text-base truncate">{selectedTeam.location}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">Supervisor: {selectedTeam.supervisor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button size="sm" onClick={() => setIsAddingWorker(true)} className="flex-1 sm:flex-none">
                      <Plus className="h-4 w-4 mr-1" /> Add Worker
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTeamId(null)}>
                          Back to Teams List
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if(confirm("Permanently delete this team?")) {
                              deleteTeamMutation.mutate(selectedTeamId || '');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Workers List + Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Workers List</CardTitle>
                  <CardDescription>Click on a worker to mark attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTeam.workers.map((worker) => (
                       <div key={worker._id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${selectedWorkerId === worker._id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}>
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="font-medium text-foreground truncate">{worker.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">ID: {worker.aadhaarId}</p>
                          {worker.lastAttendance && (
                            <p className="text-[10px] text-muted-foreground">Last: {worker.lastAttendance}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                          {getStatusBadge(worker)}
                          {worker.status !== 'present' && (
                            <Button
                              size="sm"
                              variant={selectedWorkerId === worker._id ? "default" : "outline"}
                              onClick={() => setSelectedWorkerId(worker._id)}
                              className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                            >
                              <UserCheck size={14} className="sm:mr-1" />
                              <span className="hidden sm:inline">Mark</span>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setWorkerForm({ name: worker.name, aadhaarId: worker.aadhaarId, irisClassLabel: worker.irisClassLabel });
                                setEditingWorker(worker);
                              }}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Info
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if(confirm(`Remove ${worker.name}?`)) {
                                    deleteWorkerMutation.mutate({ teamId: selectedTeamId || '', workerId: worker._id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Verification Panel */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">ID or Iris Verification</CardTitle>
                  <CardDescription>
                    {selectedWorker ? `Marking attendance for: ${selectedWorker.name}` : 'Select a worker to mark attendance'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedWorker ? (
                    <>
                      {/* Worker Info */}
                      <div className="p-3 bg-secondary rounded-lg">
                        <h4 className="font-medium text-foreground">{selectedWorker.name}</h4>
                        <p className="text-sm text-muted-foreground">Aadhaar: {selectedWorker.aadhaarId}</p>
                      </div>

                      {/* Iris Verification */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Iris Capture & Verification</h4>

                        <div className="flex gap-2 mb-2">
                          <Button variant={irisScanMode === 'capture' ? 'default' : 'outline'} onClick={() => setIrisScanMode('capture')}>
                            <Camera className="h-4 w-4 mr-2" /> Capture Image
                          </Button>
                          <Button variant={irisScanMode === 'upload' ? 'default' : 'outline'} onClick={() => setIrisScanMode('upload')}>
                            <Upload className="h-4 w-4 mr-2" /> Upload Image
                          </Button>
                        </div>

                        {irisScanMode === 'capture' ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              {!irisLiveActive ? (
                                <Button onClick={startStream} variant="outline">
                                  <Eye className="h-4 w-4 mr-2" /> Start Camera
                                </Button>
                              ) : (
                                <Button onClick={stopStream} variant="outline">
                                  Stop Camera
                                </Button>
                              )}
                              <Button onClick={captureFrame} disabled={!irisLiveActive}>
                                Capture Iris
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="border rounded-lg overflow-hidden">
                                <div className="text-xs p-1 bg-muted">Live Preview</div>
                                <video ref={irisVideoRef} className="w-full h-40 object-cover bg-black" playsInline muted />
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="text-xs p-1 bg-muted">Captured Preview</div>
                                {capturedIrisImage ? (
                                  <div className="w-full h-48 bg-black">
                                    <img src={capturedIrisImage} alt="Captured Iris" className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">No capture yet</div>
                                )}
                              </div>
                            </div>
                            <Button onClick={handleIrisVerify} disabled={irisVerificationStatus === 'scanning' || !capturedIrisImage} className="w-full">
                              {irisVerificationStatus === 'scanning' ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" /> Verifying Iris...
                                </>
                              ) : (
                                <>
                                  <Scan className="mr-2 h-4 w-4" /> Verify Iris
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Input type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => setUploadedIrisImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }} />
                            <div className="border rounded-lg overflow-hidden">
                              <div className="text-xs p-1 bg-muted">Uploaded Preview</div>
                              {uploadedIrisImage ? (
                                <div className="w-full h-48 bg-black">
                                  <img src={uploadedIrisImage} alt="Uploaded Iris" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">No file selected</div>
                              )}
                            </div>
                            <Button onClick={handleIrisVerify} disabled={irisVerificationStatus === 'scanning' || !uploadedIrisImage} className="w-full">
                              {irisVerificationStatus === 'scanning' ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" /> Verifying Iris...
                                </>
                              ) : (
                                <>
                                  <Scan className="mr-2 h-4 w-4" /> Verify Iris
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {irisVerificationStatus === 'matched' && (
                          <div className="p-3 bg-success/10 border border-success/30 rounded-lg animate-in zoom-in-95">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-5 w-5 text-success" />
                              <span className="text-success font-semibold italic">Identity Confirmed: {selectedWorker?.name}</span>
                            </div>
                          </div>
                        )}
                        {irisVerificationStatus === 'failed' && (
                          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive font-medium">Iris Verification Failed</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mark Attendance Button */}
                      {irisVerificationStatus === 'matched' && (
                        <Button onClick={markAttendance} disabled={markAttendanceMutation.isPending} className="w-full bg-success hover:bg-success/90 text-success-foreground">
                          {markAttendanceMutation.isPending ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          {markAttendanceMutation.isPending ? 'Processing API...' : 'Confirm Attendance'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Scan size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Select a worker from the list to mark attendance</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Worker CRUD Modal */}
      <Dialog open={isAddingWorker || !!editingWorker} onOpenChange={(open) => {
          if (!open) {
            setIsAddingWorker(false);
            setEditingWorker(null);
            setWorkerForm({ name: '', aadhaarId: '', irisClassLabel: '' });
          }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
               {editingWorker ? 'Edit Profile' : 'Add New Worker'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
               {editingWorker ? 'Update profile information for this worker.' : 'Onboard a new worker to this team.'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">FullName</Label>
              <Input 
                id="name" 
                placeholder="Rahul Sharma" 
                className="h-11"
                value={workerForm.name}
                onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="aadhaar" className="text-xs font-bold text-muted-foreground uppercase">Aadhaar / ID</Label>
              <Input 
                id="aadhaar" 
                placeholder="12-digit number" 
                className="h-11"
                value={workerForm.aadhaarId}
                onChange={e => setWorkerForm({...workerForm, aadhaarId: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground uppercase">AI Label Mapping</Label>
              <Select 
                value={workerForm.irisClassLabel} 
                onValueChange={val => setWorkerForm({...workerForm, irisClassLabel: val})}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select AI model label" />
                </SelectTrigger>
                <SelectContent>
                  {mlLabels.map(label => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                  {mlLabels.length === 0 && <p className="p-2 text-xs text-muted-foreground">No labels found</p>}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic px-1">
                Note: This must match a pre-trained label in the IRIS model.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-11" onClick={() => {
                setIsAddingWorker(false);
                setEditingWorker(null);
            }}>Cancel</Button>
            <Button 
                className="h-11 flex-1 font-bold"
                disabled={!workerForm.name || !workerForm.irisClassLabel}
                onClick={() => {
                   if (editingWorker) {
                      updateWorkerMutation.mutate({ 
                        teamId: selectedTeamId || '', 
                        workerId: editingWorker._id, 
                        worker: workerForm 
                      });
                   } else {
                      addWorkerMutation.mutate({ 
                        teamId: selectedTeamId || '', 
                        worker: workerForm 
                      });
                   }
                }}
            >
              {addWorkerMutation.isPending || updateWorkerMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Worker</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CurrentTeam;