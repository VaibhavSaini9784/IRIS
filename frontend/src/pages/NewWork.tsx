import { useState, useMemo } from 'react';
import Layout from '../components/Layout';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import {
  Plus, User, Users, CheckCircle2, Trash2, Save, MapPin,
  Loader2, ArrowRight, ArrowLeft, Briefcase, Eye, Fingerprint
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';


interface NewWorker {
  _id: string;
  name: string;
  aadhaarId: string;
  irisClassLabel: string;
}

// These match the ML model's trained class labels
const FALLBACK_LABELS = [
  'Shrey', 'Stuti_Agarwal', 'Sumit', 'Taruna',
  'UmangJoshi', 'VC', 'VS', 'Vaibhav_Chhipa', 'Vansh'
];


const STEPS = [
  { number: 1, label: 'Project Info', icon: Briefcase },
  { number: 2, label: 'Add Workers', icon: Users },
  { number: 3, label: 'Review & Save', icon: CheckCircle2 },
];

const NewWork = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Fetch trained labels from the ML API (via proxy)
  const { data: labelData } = useQuery({
    queryKey: ['ml-labels'],
    queryFn: async () => {
      const { data } = await api.get('/labels');
      return data.labels as string[];
    },
    staleTime: 60000
  });

  const predefinedIrisLabels = useMemo(() => labelData || FALLBACK_LABELS, [labelData]);


  // Step 1: Team Details
  const [teamName, setTeamName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // Step 2: Workers
  const [workers, setWorkers] = useState<NewWorker[]>([]);
  const [workerName, setWorkerName] = useState('');
  const [workerAadhaar, setWorkerAadhaar] = useState('');
  const [irisClassLabel, setIrisClassLabel] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToStep = (target: number) => {
    if (target === 2 && (!teamName || !workLocation || !supervisor)) {
      toast({ title: 'Fill required fields', description: 'Team Name, Supervisor, and Location are required.', variant: 'destructive' });
      return;
    }
    if (target === 3 && workers.length === 0) {
      toast({ title: 'Add at least one worker', description: 'A team needs at least one worker assigned.', variant: 'destructive' });
      return;
    }
    setStep(target);
  };

  const handleAddWorker = () => {
    if (!workerName || !irisClassLabel) {
      toast({ title: 'Worker name & Iris Tag required', description: 'Both fields must be filled to add a worker.', variant: 'destructive' });
      return;
    }
    setWorkers([...workers, {
      _id: 'worker_' + Date.now().toString(),
      name: workerName,
      aadhaarId: workerAadhaar,
      irisClassLabel
    }]);
    setWorkerName('');
    setWorkerAadhaar('');
    setIrisClassLabel('');
  };

  const handleSaveTeam = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/team', { teamName, workLocation, workDescription, supervisor, workers });
      toast({ title: '✅ Team Created!', description: `"${teamName}" is live and ready for attendance.` });
      navigate('/current-team');
    } catch {
      toast({ title: 'Error', description: 'Failed to save team. Check backend connection.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Create New Work Team">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Step Indicator */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />
          {STEPS.map(s => {
            const Icon = s.icon;
            const isActive = step === s.number;
            const isDone = step > s.number;
            return (
              <div key={s.number} className="flex flex-col items-center gap-1 bg-background px-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isDone ? 'bg-success border-success text-white' :
                    isActive ? 'bg-primary border-primary text-primary-foreground' :
                      'bg-background border-border text-muted-foreground'
                  }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Project Info */}
        {step === 1 && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Briefcase className="h-5 w-5" /> Step 1 — Project Details
              </CardTitle>
              <CardDescription>Fill in the information about this MNREGA work assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">
                    Team / Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="teamName" placeholder="e.g., Road Repair Crew A" value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisor">
                    Supervisor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="supervisor" placeholder="e.g., Rajesh Kumar" value={supervisor} onChange={e => setSupervisor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">
                  Work Location <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="location" className="pl-9" placeholder="e.g., Sector 45, Village Rampur" value={workLocation} onChange={e => setWorkLocation(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Task Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="description" placeholder="Describe the day's work objectives..." rows={3} value={workDescription} onChange={e => setWorkDescription(e.target.value)} />
              </div>
              <Button className="w-full" size="lg" onClick={() => goToStep(2)}>
                Continue to Add Workers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Add Workers */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Add Worker Form */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" /> Step 2 — Add Workers
                </CardTitle>
                <CardDescription>
                  Add each worker. The <strong>Iris Tag</strong> must match the AI model so it can recognise them during scans.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Worker Full Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Sumit Sharma" value={workerName} onChange={e => setWorkerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhaar / Worker ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input placeholder="e.g., 1234-5678-9012" value={workerAadhaar} onChange={e => setWorkerAadhaar(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    Iris Recognition Tag <span className="text-destructive">*</span>
                  </Label>
                  <Select value={irisClassLabel} onValueChange={setIrisClassLabel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the tag that matches this person in the AI model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedIrisLabels.map(label => (
                        <SelectItem key={label} value={label}>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 text-primary" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    💡 This must exactly match the name used when training the AI model. Wrong tag = verification will always fail.
                  </p>
                </div>

                <Button onClick={handleAddWorker} className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add to Roster
                </Button>
              </CardContent>
            </Card>

            {/* Worker Roster */}
            <Card className={`border-2 ${workers.length > 0 ? 'border-success/30' : 'border-border'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Worker Roster</CardTitle>
                  <Badge variant="outline">{workers.length} worker{workers.length !== 1 ? 's' : ''} added</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {workers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No workers added yet. Use the form above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workers.map((w, i) => (
                      <div key={w._id} className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{w.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs py-0">
                                <Fingerprint className="h-2.5 w-2.5 mr-1" />{w.irisClassLabel}
                              </Badge>
                              {w.aadhaarId && <span className="text-xs text-muted-foreground font-mono">{w.aadhaarId}</span>}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setWorkers(workers.filter(x => x._id !== w._id))} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => goToStep(3)} className="flex-1" disabled={workers.length === 0}>
                Review & Save <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Save */}
        {step === 3 && (
          <Card className="border-2 border-success/30">
            <CardHeader className="bg-success/5 border-b">
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" /> Step 3 — Review & Launch
              </CardTitle>
              <CardDescription>Double-check the details below before saving.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Summary */}
              <div className="rounded-lg bg-muted/30 border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Team Name</p>
                    <p className="font-semibold">{teamName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Supervisor</p>
                    <p className="font-semibold">{supervisor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Location</p>
                    <p className="font-semibold">{workLocation}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Workers</p>
                    <p className="font-semibold">{workers.length} assigned</p>
                  </div>
                </div>
                {workDescription && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Task</p>
                    <p className="text-sm">{workDescription}</p>
                  </div>
                )}
              </div>

              {/* Worker list */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Workers Assigned</p>
                {workers.map((w, i) => (
                  <div key={w._id} className="flex items-center gap-3 p-2.5 border rounded-lg bg-background">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{w.name}</span>
                      {w.aadhaarId && <span className="text-xs text-muted-foreground font-mono ml-2">{w.aadhaarId}</span>}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Fingerprint className="h-2.5 w-2.5 mr-1" />{w.irisClassLabel}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="w-1/3">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button onClick={handleSaveTeam} className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : <><Save className="mr-2 h-5 w-5" /> Launch Team</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default NewWork;