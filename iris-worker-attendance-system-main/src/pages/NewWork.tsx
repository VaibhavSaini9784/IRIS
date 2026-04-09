import { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Plus, User, Users, Scan, CheckCircle2, XCircle, Trash2, Save } from 'lucide-react';

interface NewWorker {
  id: string;
  name: string;
  aadhaarId: string;
  panId?: string;
  phone: string;
  address: string;
  verified: boolean;
}

const NewWork = () => {
  const { toast } = useToast();

  const [teamName, setTeamName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [workers, setWorkers] = useState<NewWorker[]>([]);

  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerAadhaar, setWorkerAadhaar] = useState('');
  const [workerPan, setWorkerPan] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerAddress, setWorkerAddress] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');

  const handleVerifyWorker = () => {
    if (!workerName || !workerAadhaar) {
      toast({
        title: "Missing Information",
        description: "Please enter worker name and Aadhaar ID",
        variant: "destructive",
      });
      return;
    }

    setVerificationStatus('verifying');

    setTimeout(() => {
      if (workerAadhaar.replace(/\D/g, '').length === 12) {
        setVerificationStatus('verified');
        toast({
          title: "Verification Successful",
          description: `Worker ${workerName} verified`,
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Verification Failed",
          description: "Invalid Aadhaar ID",
          variant: "destructive",
        });
      }
    }, 1500);
  };

  const handleAddWorker = () => {
    if (verificationStatus !== 'verified') return;

    const newWorker: NewWorker = {
      id: Date.now().toString(),
      name: workerName,
      aadhaarId: workerAadhaar,
      panId: workerPan,
      phone: workerPhone,
      address: workerAddress,
      verified: true
    };

    setWorkers([...workers, newWorker]);

    setWorkerName('');
    setWorkerAadhaar('');
    setWorkerPan('');
    setWorkerPhone('');
    setWorkerAddress('');
    setVerificationStatus('idle');
    setShowWorkerForm(false);
  };

  const handleRemoveWorker = (id: string) => {
    setWorkers(workers.filter(w => w.id !== id));
  };

  // 🔥 MAIN CHANGE (Backend connect)
  const handleSaveTeam = async () => {
    if (!teamName || !workLocation || !supervisor || workers.length === 0) {
      toast({
        title: "Incomplete Information",
        description: "Fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          teamName,
          workLocation,
          workDescription,
          supervisor,
          workers
        })
      });

      await res.json();

      toast({
        title: "Team Saved 🚀",
        description: `${teamName} stored in database`,
      });

      setTeamName('');
      setWorkLocation('');
      setWorkDescription('');
      setSupervisor('');
      setWorkers([]);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Create New Work Team">
      <div className="space-y-6">

        {/* Team Info */}
        <Card>
          <CardContent className="space-y-3">
            <Input placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} />
            <Input placeholder="Supervisor" value={supervisor} onChange={e => setSupervisor(e.target.value)} />
            <Input placeholder="Work Location" value={workLocation} onChange={e => setWorkLocation(e.target.value)} />
            <Textarea placeholder="Description" value={workDescription} onChange={e => setWorkDescription(e.target.value)} />
          </CardContent>
        </Card>

        {/* Worker Add */}
        <Card>
          <CardContent className="space-y-3">
            <Button onClick={() => setShowWorkerForm(true)}>Add Worker</Button>

            {showWorkerForm && (
              <>
                <Input placeholder="Name" value={workerName} onChange={e => setWorkerName(e.target.value)} />
                <Input placeholder="Aadhaar" value={workerAadhaar} onChange={e => setWorkerAadhaar(e.target.value)} />
                <Input placeholder="Phone" value={workerPhone} onChange={e => setWorkerPhone(e.target.value)} />

                <Button onClick={handleVerifyWorker}>Verify</Button>
                <Button onClick={handleAddWorker}>Add</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Worker List */}
        <Card>
          <CardContent>
            {workers.map(w => (
              <div key={w.id} className="flex justify-between">
                <span>{w.name}</span>
                <Button onClick={() => handleRemoveWorker(w.id)}>Remove</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save */}
        <Button onClick={handleSaveTeam} className="w-full">
          <Save className="mr-2" />
          Create Team
        </Button>

      </div>
    </Layout>
  );
};

export default NewWork;