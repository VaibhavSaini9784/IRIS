import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Users, Scan, CheckCircle2, XCircle, Clock, UserCheck, Camera, Upload, Eye } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  aadhaarId: string;
  status: 'present' | 'absent' | 'pending';
  lastAttendance?: string;
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  // ID + Iris verification states
  const [idVerificationStatus, setIdVerificationStatus] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
  const [irisVerificationStatus, setIrisVerificationStatus] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
  const [idScanAttempts, setIdScanAttempts] = useState(0);
  const [showManualIdEntry, setShowManualIdEntry] = useState(false);
  const [idScanMode, setIdScanMode] = useState<'capture' | 'upload'>('capture');
  // Camera/preview state for ID
  const idVideoRef = useRef<HTMLVideoElement | null>(null);
  const idStreamRef = useRef<MediaStream | null>(null);
  const [idLiveActive, setIdLiveActive] = useState(false);
  const [capturedIdImage, setCapturedIdImage] = useState<string | null>(null);
  const [uploadedIdImage, setUploadedIdImage] = useState<string | null>(null);
  // Camera/preview state for Iris
  const irisVideoRef = useRef<HTMLVideoElement | null>(null);
  const irisStreamRef = useRef<MediaStream | null>(null);
  const [irisLiveActive, setIrisLiveActive] = useState(false);
  const [capturedIrisImage, setCapturedIrisImage] = useState<string | null>(null);

  // Mock teams data - replace with API call
  const teams: Team[] = [
    {
      id: '1',
      name: 'Team Alpha',
      location: 'Sector 15, Road Construction',
      supervisor: 'राम कुमार',
      workers: [
        { id: '1', name: 'राजेश कुमार', aadhaarId: '1234-5678-9012', status: 'present', lastAttendance: '09:30 AM' },
        { id: '2', name: 'सुनीता देवी', aadhaarId: '2345-6789-0123', status: 'pending' },
        { id: '3', name: 'अमित शर्मा', aadhaarId: '3456-7890-1234', status: 'absent' },
        { id: '4', name: 'प्रिया सिंह', aadhaarId: '4567-8901-2345', status: 'present', lastAttendance: '09:45 AM' }
      ]
    },
    {
      id: '2',
      name: 'Team Beta',
      location: 'Village Pond Cleaning',
      supervisor: 'सुरेश पटेल',
      workers: [
        { id: '5', name: 'विकास यादव', aadhaarId: '5678-9012-3456', status: 'pending' },
        { id: '6', name: 'मीरा बाई', aadhaarId: '6789-0123-4567', status: 'present', lastAttendance: '08:45 AM' }
      ]
    }
  ];

  // Camera helpers
  const startStream = async (type: 'id' | 'iris') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (type === 'id') {
        idStreamRef.current = stream;
        if (idVideoRef.current) {
          idVideoRef.current.srcObject = stream;
          await idVideoRef.current.play();
        }
        setIdLiveActive(true);
      } else {
        irisStreamRef.current = stream;
        if (irisVideoRef.current) {
          irisVideoRef.current.srcObject = stream;
          await irisVideoRef.current.play();
        }
        setIrisLiveActive(true);
      }
    } catch (err) {
      toast({ title: 'Camera access denied', description: 'Please allow camera permissions to proceed.', variant: 'destructive' });
    }
  };

  const stopStream = (type: 'id' | 'iris') => {
    const ref = type === 'id' ? idStreamRef : irisStreamRef;
    const setLive = type === 'id' ? setIdLiveActive : setIrisLiveActive;
    if (ref.current) {
      ref.current.getTracks().forEach((t) => t.stop());
      ref.current = null;
      setLive(false);
    }
  };

  const captureFrame = (type: 'id' | 'iris') => {
    const video = type === 'id' ? idVideoRef.current : irisVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    if (type === 'id') {
      setCapturedIdImage(dataUrl);
    } else {
      setCapturedIrisImage(dataUrl);
    }
  };

  // ID scanning simulate; show manual entry after 3 fails
  const handleIdScan = async () => {
    setIdVerificationStatus('scanning');
    // Simulate scanning delay
    await new Promise((r) => setTimeout(r, 1000));
    setIdScanAttempts((prev) => prev + 1);
    setIdVerificationStatus('failed');
    const attempts = idScanAttempts + 1;
    toast({ title: 'ID scan failed', description: `Attempt ${attempts} of 3.`, variant: 'destructive' });
    if (attempts >= 3) {
      setShowManualIdEntry(true);
      toast({ title: 'Switch to manual entry', description: 'Please enter the worker ID manually.' });
    }
  };

  const handleManualIdVerify = async () => {
    if (!selectedWorker) return;
    if (!scannedId.trim()) {
      toast({ title: 'Enter ID', description: 'Please enter the worker ID.', variant: 'destructive' });
      return;
    }
    setIdVerificationStatus('scanning');
    await new Promise((r) => setTimeout(r, 800));
    if (scannedId.trim() === selectedWorker.aadhaarId) {
      setIdVerificationStatus('matched');
      toast({ title: 'ID verified', description: `Worker ${selectedWorker.name} verified successfully.` });
    } else {
      setIdVerificationStatus('failed');
      toast({ title: 'ID mismatch', description: 'Entered ID does not match records.', variant: 'destructive' });
    }
  };

  const handleIrisVerify = async () => {
    if (idVerificationStatus !== 'matched') {
      toast({ title: 'Complete ID verification first', variant: 'destructive' });
      return;
    }
    if (!capturedIrisImage) {
      toast({ title: 'Capture iris first', description: 'Please capture iris image to verify.', variant: 'destructive' });
      return;
    }
    setIrisVerificationStatus('scanning');
    await new Promise((r) => setTimeout(r, 1000));
    // Simulate successful iris match after capture
    setIrisVerificationStatus('matched');
    toast({ title: 'Iris match confirmed', description: 'Iris data matched with database.' });
  };

  const resetVerificationState = () => {
    setScannedId('');
    setIdVerificationStatus('idle');
    setIrisVerificationStatus('idle');
    setIdScanAttempts(0);
    setShowManualIdEntry(false);
    setIdScanMode('capture');
    setCapturedIdImage(null);
    setUploadedIdImage(null);
    setCapturedIrisImage(null);
    stopStream('id');
    stopStream('iris');
  };

  useEffect(() => {
    // Reset when worker changes
    resetVerificationState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker]);

  useEffect(() => {
    return () => {
      stopStream('id');
      stopStream('iris');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAttendance = () => {
    if (!selectedWorker || !selectedTeam) return;
    if (!(idVerificationStatus === 'matched' && irisVerificationStatus === 'matched')) {
      toast({ title: 'Verification incomplete', description: 'Please complete ID and iris verification.', variant: 'destructive' });
      return;
    }
    // Update worker status (in real app, make API call)
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id 
        ? {
            ...team,
            workers: team.workers.map(worker =>
              worker.id === selectedWorker.id
                ? { ...worker, status: 'present' as const, lastAttendance: new Date().toLocaleTimeString('en-IN', { hour12: true }) }
                : worker
            )
          }
        : team
    );
    const updatedTeam = updatedTeams.find(team => team.id === selectedTeam.id);
    if (updatedTeam) {
      setSelectedTeam(updatedTeam);
    }
    resetVerificationState();
    setSelectedWorker(null);
    toast({
      title: 'Attendance Marked',
      description: `Attendance marked for ${selectedWorker.name}`,
    });
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
        {!selectedTeam ? (
          // Teams List
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
                      <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
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

                      {/* ID Verification */}
                      <div className="space-y-3">
                        <h4 className="font-medium">1. ID Proof Verification</h4>
                        <div className="flex gap-2">
                          <Button variant={idScanMode === 'capture' ? 'default' : 'outline'} onClick={() => setIdScanMode('capture')}>
                            <Camera className="h-4 w-4 mr-2" /> Capture Image
                          </Button>
                          <Button variant={idScanMode === 'upload' ? 'default' : 'outline'} onClick={() => setIdScanMode('upload')}>
                            <Upload className="h-4 w-4 mr-2" /> Upload Image
                          </Button>
                        </div>

                        {idScanMode === 'capture' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {!idLiveActive ? (
                                <Button onClick={() => startStream('id')} variant="outline">
                                  <Camera className="h-4 w-4 mr-2" /> Start Camera
                                </Button>
                              ) : (
                                <Button onClick={() => stopStream('id')} variant="outline">
                                  Stop Camera
                                </Button>
                              )}
                              <Button onClick={() => captureFrame('id')} disabled={!idLiveActive}>
                                Capture Photo
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="border rounded-lg overflow-hidden">
                                <div className="text-xs p-1 bg-muted">Live Preview</div>
                                <video ref={idVideoRef} className="w-full h-40 object-cover bg-black" playsInline muted />
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="text-xs p-1 bg-muted">Captured Preview</div>
                                {capturedIdImage ? (
                                  <img src={capturedIdImage} alt="Captured ID" className="w-full h-40 object-cover" />
                                ) : (
                                  <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">No capture yet</div>
                                )}
                              </div>
                            </div>
                            <Button onClick={handleIdScan} disabled={idVerificationStatus === 'scanning' || (!capturedIdImage)} className="w-full">
                              {idVerificationStatus === 'scanning' ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" /> Scanning ID...
                                </>
                              ) : (
                                <>
                                  <Scan className="mr-2 h-4 w-4" /> Scan & Verify
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => setUploadedIdImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }} />
                            <div className="border rounded-lg overflow-hidden">
                              <div className="text-xs p-1 bg-muted">Uploaded Preview</div>
                              {uploadedIdImage ? (
                                <img src={uploadedIdImage} alt="Uploaded ID" className="w-full h-40 object-cover" />
                              ) : (
                                <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">No file selected</div>
                              )}
                            </div>
                            <Button onClick={handleIdScan} disabled={idVerificationStatus === 'scanning' || (!uploadedIdImage)} className="w-full">
                              {idVerificationStatus === 'scanning' ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" /> Scanning ID...
                                </>
                              ) : (
                                <>
                                  <Scan className="mr-2 h-4 w-4" /> Scan & Verify
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {showManualIdEntry && (
                          <div className="space-y-2">
                            <Label htmlFor="manual-id">Manual ID Entry</Label>
                            <Input id="manual-id" placeholder="Enter Aadhaar (e.g., 1234-5678-9012)" value={scannedId} onChange={(e) => setScannedId(e.target.value)} />
                            <Button onClick={handleManualIdVerify} disabled={idVerificationStatus === 'scanning'} className="w-full" variant="secondary">
                              Verify Manually
                            </Button>
                            <p className="text-xs text-muted-foreground">Manual entry is enabled after 3 failed scan attempts.</p>
                          </div>
                        )}

                        {idVerificationStatus === 'matched' && (
                          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-5 w-5 text-success" />
                              <span className="text-success font-medium">ID Verification Successful</span>
                            </div>
                          </div>
                        )}
                        {idVerificationStatus === 'failed' && (
                          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive font-medium">ID Verification Failed</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Iris Verification */}
                      <div className="space-y-3">
                        <h4 className="font-medium">2. Iris Verification</h4>
                        <div className="flex items-center gap-2">
                          {!irisLiveActive ? (
                            <Button onClick={() => startStream('iris')} variant="outline">
                              <Eye className="h-4 w-4 mr-2" /> Start Camera
                            </Button>
                          ) : (
                            <Button onClick={() => stopStream('iris')} variant="outline">
                              Stop Camera
                            </Button>
                          )}
                          <Button onClick={() => captureFrame('iris')} disabled={!irisLiveActive}>
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
                              <img src={capturedIrisImage} alt="Captured Iris" className="w-full h-40 object-cover" />
                            ) : (
                              <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">No capture yet</div>
                            )}
                          </div>
                        </div>
                        <Button onClick={handleIrisVerify} disabled={irisVerificationStatus === 'scanning' || idVerificationStatus !== 'matched' || !capturedIrisImage} className="w-full">
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
                        {irisVerificationStatus === 'matched' && (
                          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-5 w-5 text-success" />
                              <span className="text-success font-medium">Iris Verification Successful</span>
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
                      {idVerificationStatus === 'matched' && irisVerificationStatus === 'matched' && (
                        <Button onClick={markAttendance} className="w-full bg-success hover:bg-success/90 text-success-foreground">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Attendance
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