import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificationWorkflow {
  current_step: string;
  contract_status: string;
  subscription_status: string;
  stripe_checkout_session_id?: string;
}

const SubscriptionPaymentPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [workflow, setWorkflow] = useState<CertificationWorkflow | null>(null);

  const levelPricing = {
    1: { price: 29.99, description: 'Level 1 Relocation Specialist Certification' },
    2: { price: 49.99, description: 'Level 2 Advanced Relocation Specialist Certification' },
    3: { price: 79.99, description: 'Level 3 Expert Relocation Specialist Certification' }
  };

  useEffect(() => {
    if (user && level) {
      fetchWorkflowDetails();
    }
  }, [user, level]);

  const fetchWorkflowDetails = async () => {
    try {
      const levelNum = parseInt(level!);
      
      const { data: workflowData } = await supabase
        .from('certification_workflows')
        .select('current_step, contract_status, subscription_status, stripe_checkout_session_id')
        .eq('user_id', user!.id)
        .eq('level', levelNum)
        .maybeSingle();

      setWorkflow(workflowData);
    } catch (error) {
      console.error('Error fetching workflow details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !level) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
        body: {
          user_id: user.id,
          level: parseInt(level)
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe Checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: 'Payment Started',
          description: 'Please complete the payment process in the new window.',
        });
        
        // Refresh workflow data after a short delay
        setTimeout(() => {
          fetchWorkflowDetails();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start payment process',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentStatusInfo = () => {
    if (!workflow) {
      return {
        status: 'not_available',
        message: 'Payment not available',
        color: 'secondary' as const,
        icon: AlertCircle
      };
    }

    switch (workflow.subscription_status) {
      case 'not_required':
        return {
          status: 'not_required',
          message: 'Payment not yet available',
          color: 'secondary' as const,
          icon: CreditCard
        };
      case 'pending_payment':
        return {
          status: 'pending',
          message: 'Ready to pay',
          color: 'default' as const,
          icon: CreditCard
        };
      case 'active':
        return {
          status: 'active',
          message: 'Payment completed',
          color: 'default' as const,
          icon: CheckCircle2
        };
      case 'cancelled':
        return {
          status: 'cancelled',
          message: 'Payment cancelled',
          color: 'destructive' as const,
          icon: AlertCircle
        };
      default:
        return {
          status: 'unknown',
          message: 'Unknown status',
          color: 'secondary' as const,
          icon: AlertCircle
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading payment details...</span>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getPaymentStatusInfo();
  const canPay = workflow && 
    workflow.contract_status === 'signed' && 
    workflow.current_step === 'payment' && 
    workflow.subscription_status !== 'active';

  const needsContract = !workflow || workflow.contract_status !== 'signed';
  const pricing = levelPricing[parseInt(level!) as keyof typeof levelPricing];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Level {level} Subscription Payment</h1>
          <p className="text-muted-foreground">
            Activate your Relocation Specialist subscription to complete your certification
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <statusInfo.icon className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Status:</span>
              <Badge variant={statusInfo.color}>{statusInfo.message}</Badge>
            </div>
            
            {workflow && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Contract Status:</span>
                  <Badge variant={workflow.contract_status === 'signed' ? 'default' : 'secondary'}>
                    {workflow.contract_status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Step:</span>
                  <Badge variant="outline">{workflow.current_step}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Contract Message */}
        {needsContract && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Contract Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700">
                You must complete the contract signing process before payment is available.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate(`/certification/${level}/contract`)}
              >
                Sign Contract
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subscription Details */}
        {canPay && pricing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {pricing.description}
              </CardTitle>
              <CardDescription>
                Monthly subscription to maintain your certification status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-primary">${pricing.price}</div>
                <div className="text-muted-foreground">per month</div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Your subscription includes:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Certified Relocation Specialist status</li>
                  <li>Access to exclusive resources and tools</li>
                  <li>Ongoing professional development content</li>
                  <li>Technical support and assistance</li>
                  <li>Marketing materials and certification badge</li>
                  <li>Community access and networking opportunities</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${pricing.price}/month
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                You will be redirected to Stripe to complete your payment securely
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Completed */}
        {workflow && workflow.subscription_status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Payment Completed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Congratulations! Your payment has been processed and your certification is now active.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/')}
                >
                  View Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  View Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Cancelled */}
        {workflow && workflow.subscription_status === 'cancelled' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Payment Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                Your payment was cancelled. You can retry the payment process when ready.
              </p>
              {canPay && (
                <Button 
                  className="mt-4"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  Retry Payment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;