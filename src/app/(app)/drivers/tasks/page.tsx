"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  Package, 
  Users, 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Navigation,
  Shield,
  Star,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Camera,
  FileText
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, addDoc, getDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface ProviderTask {
  id: string;
  providerId: string;
  providerName: string;
  bookingId: string;
  taskType: 'logistics';
  serviceType: 'transport' | 'delivery' | 'moving';
  status: 'assigned' | 'accepted' | 'en_route_pickup' | 'picked_up' | 'en_route_delivery' | 'delivered' | 'completed' | 'failed';
  pickupAddress: string;
  deliveryAddress: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  specialRequests: {
    fragileHandling: boolean;
    multipleDropoffs: boolean;
    helperRequired: boolean;
    insuranceRequired: boolean;
    whiteGloveService: boolean;
    assemblyRequired: boolean;
  };
  additionalStops?: Array<{
    address: string;
    type: 'pickup' | 'delivery';
    contactName?: string;
    contactPhone?: string;
    items?: string;
  }>;
  notes?: string;
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  price: number;
  providerEarnings: number;
  assignmentNote?: string;
  statusHistory: Array<{
    status: string;
    timestamp: any;
    note?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
  }>;
  createdAt: any;
  updatedAt: any;
}

export default function DriverTasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ProviderTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProviderTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch provider tasks
  useEffect(() => {
    if (!user?.uid || !getDb()) return;

    const q = query(
      collection(getDb()!, 'providerTasks'),
      where('providerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProviderTask[];
      
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return Users;
      case 'delivery': return Package;
      case 'moving': return Home;
      default: return Truck;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return 'Transport (People)';
      case 'delivery': return 'Delivery (Goods)';
      case 'moving': return 'Moving (Furniture/Household)';
      default: return serviceType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'en_route_pickup': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-orange-100 text-orange-800';
      case 'en_route_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateTaskStatus = async () => {
    if (!selectedTask || !newStatus) return;

    setIsProcessing(true);
    try {
      if (!getDb()) throw new Error('Database not initialized');
      
      const taskRef = doc(getDb()!, 'providerTasks', selectedTask.id);
      
      // Update task status
      const newStatusHistory = [
        ...selectedTask.statusHistory,
        {
          status: newStatus,
          timestamp: serverTimestamp(),
          note: statusNote || `Status updated to ${newStatus}`,
        }
      ];

      await updateDoc(taskRef, {
        status: newStatus,
        statusHistory: newStatusHistory,
        updatedAt: serverTimestamp(),
      });

      // Update the corresponding booking
      const bookingRef = doc(getDb()!, 'logisticsBookings', selectedTask.bookingId);
      await updateDoc(bookingRef, {
        trackingStatus: newStatus,
        status: newStatus === 'completed' ? 'completed' : newStatus,
        updatedAt: serverTimestamp(),
      });

      // Create notifications for client and partner
      const bookingDoc = await getDoc(bookingRef);
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        
        // Notify client
        await addDoc(collection(getDb()!, 'notifications'), {
          type: 'task_status_update',
          recipientId: bookingData.clientId,
          recipientType: 'client',
          title: 'Task Status Update',
          message: `Your ${selectedTask.serviceType} task status has been updated to ${newStatus}`,
          data: {
            bookingId: selectedTask.bookingId,
            taskId: selectedTask.id,
            status: newStatus,
            providerName: selectedTask.providerName,
          },
          read: false,
          createdAt: serverTimestamp(),
        });

        // Notify partner
        await addDoc(collection(getDb()!, 'notifications'), {
          type: 'task_status_update',
          recipientId: bookingData.partnerId,
          recipientType: 'partner',
          title: 'Provider Task Update',
          message: `Provider ${selectedTask.providerName} updated task status to ${newStatus}`,
          data: {
            bookingId: selectedTask.bookingId,
            taskId: selectedTask.id,
            status: newStatus,
            providerName: selectedTask.providerName,
          },
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: "Status Updated",
        description: `Task status has been updated to ${newStatus}`,
      });

      setShowStatusUpdate(false);
      setNewStatus('');
      setStatusNote('');
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task status',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openTaskDetails = (task: ProviderTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const openStatusUpdate = (task: ProviderTask) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setShowStatusUpdate(true);
  };

  const getNextStatus = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'assigned':
        return ['accepted', 'failed'];
      case 'accepted':
        return ['en_route_pickup', 'failed'];
      case 'en_route_pickup':
        return ['picked_up', 'failed'];
      case 'picked_up':
        return ['en_route_delivery', 'failed'];
      case 'en_route_delivery':
        return ['delivered', 'failed'];
      case 'delivered':
        return ['completed'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading tasks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Driver Tasks</h1>
          <p className="text-muted-foreground">Manage your assigned logistics tasks</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {tasks.length} tasks
        </Badge>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
            <p className="text-muted-foreground">You'll see assigned logistics tasks here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const ServiceIcon = getServiceTypeIcon(task.serviceType);
            const taskDate = task.createdAt?.toDate ? task.createdAt.toDate() : new Date();
            
            return (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ServiceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getServiceTypeLabel(task.serviceType)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From {task.clientName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{task.pickupAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{task.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Est. {task.estimatedDuration} minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-bold text-green-600">
                      ₱{task.providerEarnings.toFixed(2)}
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openTaskDetails(task)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => openStatusUpdate(task)}
                      disabled={task.status === 'completed' || task.status === 'failed'}
                    >
                      Update Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              Complete information for task #{selectedTask?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                      <p className="font-medium">{getServiceTypeLabel(selectedTask.serviceType)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge className={getStatusColor(selectedTask.status)}>
                        {selectedTask.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge className={getPriorityColor(selectedTask.priority)}>
                        {selectedTask.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Your Earnings</Label>
                      <p className="font-medium text-green-600">₱{selectedTask.providerEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Client Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedTask.clientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedTask.clientPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedTask.clientEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Location Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pickup Address</Label>
                    <p className="font-medium">{selectedTask.pickupAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Delivery Address</Label>
                    <p className="font-medium">{selectedTask.deliveryAddress}</p>
                  </div>
                  {selectedTask.additionalStops && selectedTask.additionalStops.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Additional Stops</Label>
                      <div className="space-y-2 mt-2">
                        {selectedTask.additionalStops.map((stop, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{stop.type}</Badge>
                              <span className="text-sm text-muted-foreground">Stop {index + 1}</span>
                            </div>
                            <p className="font-medium">{stop.address}</p>
                            {stop.contactName && (
                              <p className="text-sm text-muted-foreground">Contact: {stop.contactName}</p>
                            )}
                            {stop.items && (
                              <p className="text-sm text-muted-foreground">Items: {stop.items}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Special Requests */}
              {Object.values(selectedTask.specialRequests).some(Boolean) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Special Requests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedTask.specialRequests)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              {key === 'fragileHandling' && 'Fragile Handling'}
                              {key === 'helperRequired' && 'Helper Required'}
                              {key === 'insuranceRequired' && 'Insurance Required'}
                              {key === 'whiteGloveService' && 'White Glove Service'}
                              {key === 'assemblyRequired' && 'Assembly Required'}
                              {key === 'multipleDropoffs' && 'Multiple Drop-offs'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Status History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTask.statusHistory.map((entry, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="p-1 bg-primary/10 rounded-full">
                          <CheckCircle className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{entry.status.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'MMM dd, yyyy h:mm a') : 'Unknown time'}
                            </p>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedTask.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedTask.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedTask.assignmentNote && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Assignment Instructions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedTask.assignmentNote}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDetails(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowTaskDetails(false);
              openStatusUpdate(selectedTask!);
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Update the status for task #{selectedTask?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTask && getNextStatus(selectedTask.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status Note (Optional)</Label>
              <Textarea
                placeholder="Add a note about this status update..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
              Cancel
            </Button>
            <Button onClick={updateTaskStatus} disabled={isProcessing || !newStatus}>
              {isProcessing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}