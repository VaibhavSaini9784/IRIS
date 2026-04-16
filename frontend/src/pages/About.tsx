import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Shield, Scan, CheckCircle2, Clock, FileText } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Admin login with government-grade security protocols"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Create and manage MNREGA worker teams efficiently"
    },
    {
      icon: Scan,
      title: "ID Verification",
      description: "Aadhaar and PAN ID verification with iris integration"
    },
    {
      icon: CheckCircle2,
      title: "Attendance Tracking",
      description: "Real-time attendance marking with biometric verification"
    }
  ];

  const workflow = [
    {
      step: 1,
      title: "Admin Login",
      description: "Secure authentication to access the system",
      icon: Shield
    },
    {
      step: 2,
      title: "Select Team",
      description: "Choose from existing teams or create new work teams",
      icon: Users
    },
    {
      step: 3,
      title: "Worker Verification",
      description: "Scan worker ID and verify with IRIS database",
      icon: Scan
    },
    {
      step: 4,
      title: "Mark Attendance",
      description: "Confirm worker presence and update attendance records",
      icon: CheckCircle2
    }
  ];

  return (
    <Layout title="About IRIS Recognition System">
      <div className="space-y-6">
        {/* Overview */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-secondary to-accent">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <CardTitle className="text-xl text-primary">IRIS Recognition System</CardTitle>
                <CardDescription className="text-base">
                  MNREGA Worker Management Portal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              The IRIS (Intelligent Recognition & Information System) is a comprehensive
              digital platform designed to streamline attendance management for MNREGA (Mahatma Gandhi
              National Rural Employment Guarantee Act) workers. This system ensures accurate, secure,
              and efficient tracking of worker attendance through advanced ID verification and biometric
              integration.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Key Features</CardTitle>
            <CardDescription>
              Advanced capabilities for modern workforce management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg bg-accent/30">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Workflow */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">System Workflow</CardTitle>
            <CardDescription>
              Step-by-step process for marking worker attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflow.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full font-bold">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < workflow.length - 1 && (
                    <div className="absolute left-9 mt-12 w-0.5 h-4 bg-border"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">iris Integration</CardTitle>
              <CardDescription>Identity verification process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Aadhaar Verification</Badge>
                  <span className="text-sm text-muted-foreground">12-digit unique identification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">PAN Integration</Badge>
                  <span className="text-sm text-muted-foreground">Tax identification verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Biometric Matching</Badge>
                  <span className="text-sm text-muted-foreground">Iris pattern matching</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Real-time Validation</Badge>
                  <span className="text-sm text-muted-foreground">Instant database verification</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> All worker data is synchronized with the central iris database
                  maintained by the Government of India to ensure data integrity and prevent fraud.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">System Benefits</CardTitle>
              <CardDescription>Advantages for administrators and workers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h5 className="font-medium text-foreground">Fraud Prevention</h5>
                      <p className="text-sm text-muted-foreground">Eliminates proxy attendance and identity fraud</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h5 className="font-medium text-foreground">Real-time Tracking</h5>
                      <p className="text-sm text-muted-foreground">Instant attendance updates and reporting</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h5 className="font-medium text-foreground">Digital Records</h5>
                      <p className="text-sm text-muted-foreground">Paperless system with secure data storage</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h5 className="font-medium text-foreground">Transparent Process</h5>
                      <p className="text-sm text-muted-foreground">Clear audit trail for all attendance activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">System Information</CardTitle>
            <CardDescription>Technical details and support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium text-foreground">System Uptime</h4>
                <p className="text-sm text-muted-foreground">99.9% availability</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium text-foreground">Security</h4>
                <p className="text-sm text-muted-foreground">Government-grade encryption</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium text-foreground">Support</h4>
                <p className="text-sm text-muted-foreground">24/7 technical assistance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default About;