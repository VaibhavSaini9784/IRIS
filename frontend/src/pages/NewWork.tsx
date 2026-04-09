import { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Plus, User, Users, CheckCircle2, Trash2, Save, Building, Briefcase, FileSignature, MapPin, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface NewWorker {
  id: string;
  name: string;
  aadhaarId: string;
  irisClassLabel: string;
}

const NewWork = () => {
  const { toast } = useToast();

  // Team Details
  const [teamName, setTeamName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [workers, setWorkers] = useState<NewWorker[]>([]);

  // Worker Form Details
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerAadhaar, setWorkerAadhaar] = useState('');
  const [irisClassLabel, setIrisClassLabel] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-configured dataset labels to ensure ML matching works
  const predefinedIrisLabels = ['Shrey', 'Stuti_Agarwal', 'Sumit', 'Taruna', 'UmangJoshi', 'VC', 'VS', 'Vaibhav_Chhipa', 'Vansh'];

  const handleAddWorker = () => {
    if (!workerName || !irisClassLabel) {
      toast({
        title: "Missing Information",
        description: "Worker Name and Iris AI Label are strictly required.",
        variant: "destructive",
      });
      return;
    }

    const newWorker: NewWorker = {
      id: Date.now().toString(),
      name: workerName,
      aadhaarId: workerAadhaar,
      irisClassLabel
    };

    setWorkers([...workers, newWorker]);
    toast({ title: "Worker Added", description: `${workerName} added to the roster temporarily.` });

    setWorkerName('');
    setWorkerAadhaar('');
    setIrisClassLabel('');
    setShowWorkerForm(false);
  };

  const handleRemoveWorker = (id: string) => {
    setWorkers(workers.filter(w => w.id !== id));
  };

  const handleSaveTeam = async () => {
    if (!teamName || !workLocation || !supervisor || workers.length === 0) {
      toast({
        title: "Incomplete Team",
        description: "Please fill all required team details and add at least 1 worker.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Connect to the correct Node/Express port
      const res = await fetch("http://localhost:4000/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          workLocation,
          workDescription,
          supervisor,
          workers
        })
      });

      if (!res.ok) throw new Error("Server rejected save");

      await res.json();

      toast({
        title: "Team Created Successfully 🚀",
        description: `${teamName} is now live and ready for attendance marking!`,
      });

      setTeamName('');
      setWorkLocation('');
      setWorkDescription('');
      setSupervisor('');
      setWorkers([]);

    } catch (error) {
      toast({
        title: "Error Creating Team",
        description: "Failed to connect to the backend database.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Assign New Work Team">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Team Details */}
        <div className="space-y-6">
          <Card className="border-2 border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="flex items-center text-primary">
                <Briefcase className="mr-2 h-5 w-5" />
                Project Details
              </CardTitle>
              <CardDescription>Enter the general details for this MNREGA project team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="font-semibold flex items-center"><Users className="h-4 w-4 mr-1 text-muted-foreground" /> Team Name <span className="text-destructive ml-1">*</span></Label>
                <Input id="teamName" placeholder="e.g., Highway Maintenance Crew A" value={teamName} onChange={e => setTeamName(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supervisor" className="font-semibold flex items-center"><User className="h-4 w-4 mr-1 text-muted-foreground" /> Supervisor Name <span className="text-destructive ml-1">*</span></Label>
                <Input id="supervisor" placeholder="e.g., Rajesh Kumar" value={supervisor} onChange={e => setSupervisor(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold flex items-center"><MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> Work Location <span className="text-destructive ml-1">*</span></Label>
                <Input id="location" placeholder="e.g., Sector 45 Road Repair" value={workLocation} onChange={e => setWorkLocation(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold flex items-center"><FileSignature className="h-4 w-4 mr-1 text-muted-foreground" /> Task Description</Label>
                <Textarea id="description" placeholder="Briefly describe the day's objectives." rows={3} value={workDescription} onChange={e => setWorkDescription(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* New Admin Instruction Guide */}
          <Card className="bg-accent/10 border-dashed border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center">
                <Plus className="h-4 w-4 mr-1" /> Admin Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Fill in the <strong>Project Details</strong> first.</li>
                <li>Use the <strong>Add Worker</strong> button to include workers one-by-one.</li>
                <li><strong>CRITICAL</strong>: Select the correct <strong>Iris Tag</strong> for each worker to match the AI model.</li>
                <li>Review the roster and click <strong>Launch & Save</strong> to persist to the database.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workers & Save */}
        <div className="space-y-6">
          <Card className="border-2 border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Worker Roster
                </CardTitle>
                <CardDescription className="mt-1">Assign workers to this team.</CardDescription>
              </div>
              <Badge variant="outline" className="text-primary border-primary">
                {workers.length} Added
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Added Workers List */}
              {workers.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {workers.map((w, index) => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{w.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">Dataset Tag: {w.irisClassLabel}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveWorker(w.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground flex flex-col items-center">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p>No workers added yet.</p>
                </div>
              )}

              {/* Add Worker Inline Form */}
              {!showWorkerForm ? (
                <Button onClick={() => setShowWorkerForm(true)} variant="outline" className="w-full border-dashed border-2 hover:border-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Worker
                </Button>
              ) : (
                <div className="bg-accent/20 p-4 border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-semibold">Add New Worker</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowWorkerForm(false)}>Cancel</Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Worker Name *</Label>
                      <Input placeholder="e.g., Sumit" value={workerName} onChange={e => setWorkerName(e.target.value)} autoFocus />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhaar / ID</Label>
                      <Input placeholder="Optional" value={workerAadhaar} onChange={e => setWorkerAadhaar(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-primary font-medium flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Iris Model Classification Tag *</Label>
                    <Select value={irisClassLabel} onValueChange={setIrisClassLabel}>
                      <SelectTrigger className="border-primary/30 focus:ring-primary">
                        <SelectValue placeholder="Select the exact dataset label for AI to match" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedIrisLabels.map(label => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">This guarantees the worker correctly matches up with your deployed Python Machine Learning model predictions.</p>
                  </div>

                  <Button onClick={handleAddWorker} className="w-full bg-primary mt-2">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Add to Roster
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button 
            size="lg" 
            className="w-full text-lg shadow-lg hover:shadow-xl transition-all h-14" 
            onClick={handleSaveTeam} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Storing Team...</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Launch & Save Work Team</>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NewWork;