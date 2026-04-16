import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Users, Scan, CheckCircle2, XCircle, Clock, UserCheck, Camera, Upload, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Worker {
  _id: string;
  id?: string;
  name: string;
  aadhaarId: string;
  status: 'present' | 'absent' | 'pending';
  lastAttendance?: string;
  irisClassLabel: string;
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const [irisVerificationStatus, setIrisVerificationStatus] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
  const [irisScanMode, setIrisScanMode] = useState<'capture' | 'upload'>('capture');
  const [detectedPerson, setDetectedPerson] = useState<string | null>(null);

  const irisVideoRef = useRef<HTMLVideoElement | null>(null);
  const irisStreamRef = useRef<MediaStream | null>(null);
  const [irisLiveActive, setIrisLiveActive] = useState(false);
  const [capturedIrisImage, setCapturedIrisImage] = useState<string | null>(null);
  const [uploadedIrisImage, setUploadedIrisImage] = useState<string | null>(null);

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
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

  const handleIrisVerify = async () => {
    const irisImageBase64 = getActiveIrisImage();
    if (!irisImageBase64) {
      toast({ title: 'Capture iris first', description: 'Please capture iris image to verify.', variant: 'destructive' });
      return;
    }

    if (!selectedWorker) return;

    setIrisVerificationStatus('scanning');
    setDetectedPerson(null);

    try {
      const res = await fetch(irisImageBase64);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'iris.png');

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI verification failed');

      if (data.person === "Unknown") {
        setIrisVerificationStatus('failed');
        toast({ title: 'Person Unknown', description: 'Identity could not be verified. Please try again.', variant: 'destructive' });
      } else if (data.person !== selectedWorker.irisClassLabel) {
        setIrisVerificationStatus('failed');
        setDetectedPerson(data.person);
        toast({
          title: 'Identity Mismatch',
          description: `Detected ${data.person}, but you selected ${selectedWorker.name}. Access Denied.`,
          variant: 'destructive'
        });
      } else {
        setIrisVerificationStatus('matched');
        setDetectedPerson(data.person);
        toast({ title: 'Verification Success', description: `Identity confirmed as ${data.person}.` });
      }
    } catch (error: any) {
      setIrisVerificationStatus('failed');
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetVerificationState = () => {
    setIrisVerificationStatus('idle');
    setIrisScanMode('capture');
    setCapturedIrisImage(null);
    setUploadedIrisImage(null);
    setDetectedPerson(null);
    stopStream();
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
      formData.append('teamId', selectedTeam.id);
      formData.append('workerId', selectedWorker._id || (selectedWorker as any).id);

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
      setSelectedWorker(null);

      toast({
        title: 'Attendance Verified ✅',
        description: `Successfully recorded attendance for ${data.person}.`,
      });

      queryClient.invalidateQueries({ queryKey: ['teams'] });

      if (finishedTeamId && finishedWorkerId) {
        setSelectedTeam(prev => {
          if (!prev || prev.id !== finishedTeamId) return prev;
          return {
            ...prev,
            workers: prev.workers.map(w =>
              (w._id === finishedWorkerId || (w as any).id === finishedWorkerId)
                ? { ...w, status: 'present' as const, lastAttendance: new Date().toLocaleTimeString('en-IN', { hour12: true }) }
                : w
            )
          };
        });
      }
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

  const getStatusBadge = (status: Worker['status']) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-success-foreground">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
                onClick={() => setSelectedTeam(team)}>
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
                  <Button className="w-full mt-4 bg-primary hover:bg-primary-hover text-primary-foreground">
                    View Team Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Team Details & Attendance
          <div className="space-y-6">
            {/* Team Header */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-secondary to-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                      <Users size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-primary">{selectedTeam.name}</CardTitle>
                      <CardDescription className="text-base">{selectedTeam.location}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">Supervisor: {selectedTeam.supervisor}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedTeam(null)}>
                    Back to Teams
                  </Button>
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
                      <div key={worker._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{worker.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {worker.aadhaarId}</p>
                          {worker.lastAttendance && (
                            <p className="text-xs text-muted-foreground">Last: {worker.lastAttendance}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(worker.status)}
                          {worker.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedWorker(worker)}
                              className="bg-primary hover:bg-primary-hover text-primary-foreground"
                            >
                              <UserCheck size={16} className="mr-1" />
                              Mark
                            </Button>
                          )}
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
    </Layout>
  );
};

export default CurrentTeam;