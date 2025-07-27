import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Lock,
  BookOpen,
  UserCheck,
  CreditCard
} from "lucide-react";

interface CertificationWorkflowCardsProps {
  course: {
    id: string;
    level: number;
    title: string;
  };
  courseProgress: number;
  certificationWorkflow?: {
    current_step: string;
    exam_status: string;
    admin_approval_status: string;
    contract_status: string;
    subscription_status: string;
  } | null;
}

const CertificationWorkflowCards = ({ 
  course, 
  courseProgress, 
  certificationWorkflow 
}: CertificationWorkflowCardsProps) => {
  const navigate = useNavigate();

  // Debug logging to see what data we're receiving
  console.log('CertificationWorkflowCards Debug:', {
    course,
    courseProgress,
    certificationWorkflow
  });

  const steps = [
    {
      id: 'course',
      title: 'Complete Course',
      icon: BookOpen,
      description: 'Finish all course materials',
      isUnlocked: true,
      isCompleted: courseProgress === 100,
      action: () => navigate(`/course/${course.id}`),
      actionText: courseProgress === 100 ? 'Course Complete!' : 'Continue Learning',
      message: courseProgress === 100 ? 'Course completed successfully!' : `${courseProgress}% completed. Finish all lessons to unlock certification.`
    },
    {
      id: 'exam',
      title: 'Certification Exam',
      icon: FileText,
      description: 'Take the certification exam',
      isUnlocked: courseProgress === 100,
      isCompleted: certificationWorkflow?.exam_status === 'passed' || certificationWorkflow?.admin_approval_status === 'approved',
      action: () => navigate(`/certification/${course.level}/exam`),
      actionText: getExamActionText(),
      message: getExamMessage()
    },
    {
      id: 'approval',
      title: 'Admin Approval',
      icon: UserCheck,
      description: 'Wait for admin review',
      isUnlocked: certificationWorkflow?.exam_status === 'passed' || certificationWorkflow?.current_step === 'admin_approval' || certificationWorkflow?.admin_approval_status === 'approved',
      isCompleted: certificationWorkflow?.admin_approval_status === 'approved',
      action: null,
      actionText: getApprovalActionText(),
      message: getApprovalMessage()
    },
    {
      id: 'contract',
      title: 'Contract Signing',
      icon: FileText,
      description: 'Sign the certification contract',
      isUnlocked: certificationWorkflow?.admin_approval_status === 'approved',
      isCompleted: certificationWorkflow?.contract_status === 'signed',
      action: () => navigate(`/certification/${course.level}/contract`),
      actionText: getContractActionText(),
      message: getContractMessage()
    },
    {
      id: 'payment',
      title: 'Payment',
      icon: CreditCard,
      description: 'Complete certification payment',
      isUnlocked: certificationWorkflow?.contract_status === 'signed',
      isCompleted: certificationWorkflow?.subscription_status === 'active',
      action: () => {
        console.log('Payment card clicked - navigating to:', `/certification/${course.level}/payment`);
        navigate(`/certification/${course.level}/payment`);
      },
      actionText: getPaymentActionText(),
      message: getPaymentMessage()
    },
    {
      id: 'certified',
      title: 'Certified!',
      icon: GraduationCap,
      description: 'Certification complete',
      isUnlocked: certificationWorkflow?.subscription_status === 'active',
      isCompleted: certificationWorkflow?.subscription_status === 'active',
      action: null,
      actionText: 'Certified!',
      message: 'Congratulations! You are now certified.'
    }
  ];

  function getExamActionText() {
    console.log('getExamActionText - exam_status:', certificationWorkflow?.exam_status, 'admin_approval_status:', certificationWorkflow?.admin_approval_status);
    if (!certificationWorkflow) return 'Start Exam';
    // If admin approved, exam is considered passed
    if (certificationWorkflow.admin_approval_status === 'approved') return 'Passed';
    if (certificationWorkflow.exam_status === 'passed') return 'Passed';
    if (certificationWorkflow.exam_status === 'pending_submission') return 'Take Exam';
    if (certificationWorkflow.exam_status === 'under_review') return 'Under Review';
    return 'Take Exam';
  }

  function getExamMessage() {
    console.log('getExamMessage - courseProgress:', courseProgress, 'exam_status:', certificationWorkflow?.exam_status, 'admin_approval_status:', certificationWorkflow?.admin_approval_status);
    if (courseProgress < 100) return 'Complete the course first to unlock the exam.';
    if (!certificationWorkflow) return 'Ready to take your certification exam!';
    // If admin approved, exam is considered passed
    if (certificationWorkflow.admin_approval_status === 'approved') return 'Exam completed successfully!';
    if (certificationWorkflow.exam_status === 'passed') return 'Exam completed successfully!';
    if (certificationWorkflow.exam_status === 'pending_submission') return 'Take your certification exam to proceed.';
    if (certificationWorkflow.exam_status === 'under_review') return 'Your exam is being reviewed by our team.';
    return 'Take your certification exam to proceed.';
  }

  function getApprovalActionText() {
    console.log('getApprovalActionText - exam_status:', certificationWorkflow?.exam_status, 'admin_approval_status:', certificationWorkflow?.admin_approval_status);
    if (certificationWorkflow?.admin_approval_status === 'approved') return 'Approved';
    if (certificationWorkflow?.admin_approval_status === 'pending') return 'Under Review';
    if (!certificationWorkflow) return 'Locked';
    return 'Waiting';
  }

  function getApprovalMessage() {
    console.log('getApprovalMessage - exam_status:', certificationWorkflow?.exam_status, 'admin_approval_status:', certificationWorkflow?.admin_approval_status);
    if (certificationWorkflow?.admin_approval_status === 'approved') {
      return 'Your certification has been approved by an administrator!';
    }
    if (certificationWorkflow?.admin_approval_status === 'pending') {
      return 'Your exam results are being reviewed by an administrator.';
    }
    if (!certificationWorkflow) {
      return 'Complete the exam first to unlock admin review.';
    }
    return 'Waiting for admin review of your exam results.';
  }

  function getContractActionText() {
    if (certificationWorkflow?.admin_approval_status !== 'approved') return 'Locked';
    if (certificationWorkflow.contract_status === 'pending_signature') return 'Sign Contract';
    if (certificationWorkflow.contract_status === 'signed') return 'Contract Signed';
    return 'Sign Contract';
  }

  function getContractMessage() {
    if (certificationWorkflow?.admin_approval_status !== 'approved') {
      return 'Get admin approval first to unlock contract signing.';
    }
    if (certificationWorkflow.contract_status === 'pending_signature') {
      return 'Your contract is ready for signature.';
    }
    if (certificationWorkflow.contract_status === 'signed') {
      return 'Contract signed successfully! Proceed to payment.';
    }
    return 'Sign your certification contract to proceed.';
  }

  function getPaymentActionText() {
    console.log('getPaymentActionText - contract_status:', certificationWorkflow?.contract_status, 'subscription_status:', certificationWorkflow?.subscription_status);
    if (certificationWorkflow?.contract_status !== 'signed') return 'Locked';
    if (certificationWorkflow.subscription_status === 'active') return 'Payment Complete';
    return 'Pay Now';
  }

  function getPaymentMessage() {
    if (certificationWorkflow?.contract_status !== 'signed') {
      return 'Sign the contract first to unlock payment.';
    }
    if (certificationWorkflow.subscription_status === 'active') {
      return 'Payment completed successfully!';
    }
    return 'Complete your certification payment.';
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Level {course.level} Certification Process
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLocked = !step.isUnlocked;
          const showConnector = index < steps.length - 1;
          
          return (
            <div key={step.id} className="relative">
              <Card className={`transition-all ${
                isLocked 
                  ? 'opacity-60 bg-muted/30' 
                  : step.isCompleted 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-primary/50 bg-primary/5'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className={`p-2 rounded-full ${
                      isLocked 
                        ? 'bg-muted text-muted-foreground' 
                        : step.isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : step.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={isLocked ? 'text-muted-foreground' : ''}>{step.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className={`text-xs ${isLocked ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {step.description}
                  </p>
                  
                  <p className={`text-sm ${isLocked ? 'text-muted-foreground' : ''}`}>
                    {step.message}
                  </p>
                  
                  {step.action && step.isUnlocked && !step.isCompleted && (
                    <Button 
                      size="sm" 
                      onClick={step.action}
                      className="w-full"
                      variant={step.id === 'course' ? 'outline' : 'default'}
                    >
                      {step.actionText}
                    </Button>
                  )}
                  
                  {(isLocked || step.isCompleted || !step.action) && (
                    <div className="flex items-center justify-center p-2">
                      <Badge 
                        variant={step.isCompleted ? 'default' : 'secondary'}
                        className={step.isCompleted ? 'bg-green-600 text-white' : ''}
                      >
                        {step.actionText}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Connector line for larger screens */}
              {showConnector && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border transform -translate-y-1/2 z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificationWorkflowCards;