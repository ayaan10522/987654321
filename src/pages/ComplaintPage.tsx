import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

type Complaint = {
  id: string;
  studentId: string;
  message: string;
  status: 'pending' | 'addressed';
  response?: string;
  createdAt: string;
  updatedAt: string;
};

type UserRole = 'student' | 'principal';

export function ComplaintPage() {
  const [message, setMessage] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole] = useState<UserRole>('student'); // In a real app, this would come from auth context
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  // Check if user has already submitted a complaint today
  const hasSubmittedToday = complaints.some(complaint => {
    const today = new Date().toDateString();
    const complaintDate = new Date(complaint.createdAt).toDateString();
    return complaintDate === today;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter your complaint');
      return;
    }

    if (hasSubmittedToday) {
      setError('You can only submit one complaint per day');
      return;
    }

    // In a real app, this would be an API call
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      studentId: 'student123', // Would come from auth in a real app
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComplaints([newComplaint, ...complaints]);
    setMessage('');
    setSuccess('Your complaint has been submitted successfully');
    setError('');
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleResponseSubmit = (complaintId: string) => {
    const response = responseText[complaintId]?.trim();
    if (!response) return;

    setComplaints(complaints.map(comp => 
      comp.id === complaintId 
        ? { ...comp, response, status: 'addressed', updatedAt: new Date().toISOString() }
        : comp
    ));
    
    setResponseText({ ...responseText, [complaintId]: '' });
  };

  // Mock data for testing
  useEffect(() => {
    if (userRole === 'principal') {
      setComplaints([
        {
          id: '1',
          studentId: 'student123',
          message: 'The water cooler on the 2nd floor is not working',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          studentId: 'student456',
          message: 'The library closes too early',
          status: 'addressed',
          response: 'We will extend the library hours starting next week.',
          createdAt: '2023-12-24T10:00:00Z',
          updatedAt: '2023-12-24T11:30:00Z',
        },
      ]);
    }
  }, [userRole]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {userRole === 'principal' ? 'Student Complaints' : 'Submit a Complaint'}
      </h1>

      {userRole === 'student' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit a New Complaint</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your complaint..."
                rows={5}
                disabled={hasSubmittedToday}
                className="w-full"
              />
              {hasSubmittedToday && (
                <p className="text-sm text-muted-foreground mt-2">
                  You have already submitted a complaint today. Please try again tomorrow.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={hasSubmittedToday}>
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          {userRole === 'principal' ? 'All Complaints' : 'Your Complaints'}
        </h2>
        
        {complaints.length === 0 ? (
          <p className="text-muted-foreground">No complaints found.</p>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden">
                <div className={`p-4 ${complaint.status === 'addressed' ? 'bg-green-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {userRole === 'principal' && `Student ID: ${complaint.studentId} • `}
                        {format(new Date(complaint.createdAt), 'MMM d, yyyy h:mm a')}
                        {complaint.status === 'addressed' && ' • Addressed'}
                      </p>
                      <p className="mt-2 text-gray-700">{complaint.message}</p>
                      
                      {complaint.response && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-500 mb-1">Principal's Response:</p>
                          <p className="text-gray-800">{complaint.response}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Updated: {format(new Date(complaint.updatedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {complaint.status === 'pending' && userRole === 'principal' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="text-sm text-yellow-600">Pending</span>
                      </div>
                    )}
                  </div>

                  {userRole === 'principal' && !complaint.response && (
                    <div className="mt-4">
                      <Textarea
                        value={responseText[complaint.id] || ''}
                        onChange={(e) => 
                          setResponseText({ ...responseText, [complaint.id]: e.target.value })
                        }
                        placeholder="Type your response here..."
                        rows={3}
                        className="w-full"
                      />
                      <div className="mt-2 flex justify-end">
                        <Button 
                          onClick={() => handleResponseSubmit(complaint.id)}
                          disabled={!responseText[complaint.id]?.trim()}
                        >
                          Send Response
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintPage;
