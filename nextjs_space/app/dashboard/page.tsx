'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TwitterRateLimitBanner } from '@/components/twitter-rate-limit-banner'
import { LateRateLimitBanner } from '@/components/late-rate-limit-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Home,
  Folder,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Users,
  Palette,
  FileText,
  Wand2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  Share2,
  Video,
  Image as ImageIcon,
  Building2,
  Music2,
  AtSign,
  Cloud
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import {
  fetchTemplatesOptimized,
  fetchTeamsOptimized,
  fetchProfilesOptimized,
  fetchInitialDataOptimized,
  postToAllPlatformsOptimized,
  invalidateAllCaches,
  getCacheStats
} from '@/lib/content-journey-optimizer'

// Types
interface TemplateField {
  id: string
  fieldName: string
  fieldLabel: string
  fieldType: string
  defaultValue: string | null
  isRequired: boolean
  order: number
  fontSize?: number
  fontFamily?: string
  fontColor?: string
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string
  width: number
  height: number
  usageCount: number
  platforms: string[]
  fields?: TemplateField[]
}

interface WorkspaceBranding {
  id: string
  name: string
  logoUrl: string | null
  brandColors: string[]
  isDefault: boolean
}

interface PlatformIcon {
  name: string
  icon: React.ReactNode
  color: string
}

interface Team {
  id: string
  name: string
  members: TeamMember[]
}

interface TeamMember {
  id: string
  name: string
  handle?: string | null
}

interface WizardState {
  currentStep: number
  selectedCategory: string | null
  selectedTemplates: Template[]  // Changed to array for bulk selection
  currentTemplateIndex: number  // Track which template we're working on
  formData: Record<string, string>  // Current template form data
  formDataByTemplate: Record<string, Record<string, string>>  // Store data for each template by ID
  selectedBranding: WorkspaceBranding | null
  visualEffects: {
    filter: string
    opacity: number
    blur: number
  }
  promptInstructions: string  // For AI generation prompts
  selectedPromptId: string | null  // Selected saved prompt
  generatedContent: {
    content: string
    caption: string
    hashtags: string
  }
  generatedContentByTemplate: Record<string, { content: string, caption: string, hashtags: string }>  // Generated content per template
  generatedGraphicUrls: Record<string, string>  // Canvas data URLs for each template
  editableContentByPlatform: Record<string, string>  // Editable content per platform
  selectedPlatforms: string[]
  selectedTeams: string[]  // Team IDs for tagging
  selectedTags: string[]
  selectedProfileId: string | null  // Selected profile for posting
  scheduleType: string
  scheduledDate: string
  scheduledTime: string
  isRecurring: boolean
}

// Constants
const platformIcons: Record<string, PlatformIcon> = {
  facebook: { name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'text-blue-600' },
  twitter: { name: 'Twitter', icon: <Twitter className="w-5 h-5" />, color: 'text-sky-500' },
  instagram: { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'text-pink-600' },
  linkedin: { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: 'text-blue-700' },
  youtube: { name: 'YouTube', icon: <Youtube className="w-5 h-5" />, color: 'text-red-600' },
  tiktok: { name: 'TikTok', icon: <Music2 className="w-5 h-5" />, color: 'text-black' },
  threads: { name: 'Threads', icon: <AtSign className="w-5 h-5" />, color: 'text-gray-900' },
  bluesky: { name: 'Bluesky', icon: <Cloud className="w-5 h-5" />, color: 'text-blue-400' }
}

const folderColors: Record<string, { bg: string, icon: string }> = {
  sports: { bg: 'bg-blue-50', icon: 'text-blue-500' },
  quotes: { bg: 'bg-purple-50', icon: 'text-purple-500' },
  promotional: { bg: 'bg-green-50', icon: 'text-green-500' },
  events: { bg: 'bg-yellow-50', icon: 'text-yellow-500' },
  custom: { bg: 'bg-gray-50', icon: 'text-gray-500' },
}

const STEPS = [
  { id: 1, title: 'Choose Template', icon: Folder, description: 'Select a category and template' },
  { id: 2, title: 'Fill Information', icon: FileText, description: 'Enter template data' },
  { id: 3, title: 'Customize Design', icon: Palette, description: 'Apply branding and effects' },
  { id: 4, title: 'Generate Content', icon: Sparkles, description: 'Create AI-powered posts' },
  { id: 5, title: 'Select Platforms', icon: Users, description: 'Choose platforms and tags' },
  { id: 6, title: 'Schedule & Review', icon: Calendar, description: 'Final review and publish' },
]

export default function ContentJourneyPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [brandings, setBrandings] = useState<WorkspaceBranding[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  
  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    selectedCategory: null,
    selectedTemplates: [],
    currentTemplateIndex: 0,
    formData: {},
    formDataByTemplate: {},  // NEW: Store data per template
    selectedBranding: null,
    visualEffects: {
      filter: 'none',
      opacity: 100,
      blur: 0
    },
    promptInstructions: '',
    selectedPromptId: null,
    generatedContent: {
      content: '',
      caption: '',
      hashtags: ''
    },
    generatedContentByTemplate: {},  // NEW: Store generated content per template
    generatedGraphicUrls: {},  // Store canvas data URLs per template
    editableContentByPlatform: {},  // Store edited content per platform
    selectedPlatforms: [],
    selectedTeams: [],
    selectedTags: [],
    selectedProfileId: null,
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    isRecurring: false
  })



  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Use optimized parallel fetch with caching and retry
      const { templates: templatesResult, teams: teamsResult } = await fetchInitialDataOptimized()

      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data)
      } else if (templatesResult.error) {
        console.error('Templates fetch error:', templatesResult.error)
      }

      if (teamsResult.success && teamsResult.data) {
        setTeams(teamsResult.data)
      } else if (teamsResult.error) {
        console.error('Teams fetch error:', teamsResult.error)
      }

      // Show error only if both failed
      if (!templatesResult.success && !teamsResult.success) {
        toast({
          title: 'Error',
          description: 'Failed to load data. Please refresh the page.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Validation logic using useMemo to prevent re-renders
  const stepValidation = useMemo(() => {
    const validation: Record<number, boolean> = {}
    
    // Step 1: At least one template selected
    validation[1] = wizardState.selectedTemplates.length > 0
    
    // Step 2: All required fields filled for current template
    const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]
    if (currentTemplate?.fields) {
      const requiredFields = currentTemplate.fields.filter(f => f.isRequired)
      validation[2] = requiredFields.every(f => wizardState.formData[f.fieldName]?.trim())
    } else {
      validation[2] = wizardState.selectedTemplates.length > 0
    }
    
    // Step 3: Optional - always valid (Customize Design is not required)
    validation[3] = true
    
    // Step 4: Content generated (check if at least one template has content)
    validation[4] = Object.keys(wizardState.generatedContentByTemplate).length > 0 &&
      Object.values(wizardState.generatedContentByTemplate).some((content: any) => content.content?.trim())
    
    // Step 5: At least one platform selected
    validation[5] = wizardState.selectedPlatforms.length > 0
    
    // Step 6: Valid schedule
    if (wizardState.scheduleType === 'scheduled') {
      validation[6] = !!(wizardState.scheduledDate && wizardState.scheduledTime)
    } else {
      validation[6] = true
    }
    
    return validation
  }, [
    wizardState.selectedTemplates,
    wizardState.currentTemplateIndex,
    wizardState.formData,
    wizardState.generatedContentByTemplate,
    wizardState.selectedPlatforms,
    wizardState.scheduleType,
    wizardState.scheduledDate,
    wizardState.scheduledTime
  ])

  const goToStep = (step: number) => {
    // Check if previous steps are valid
    for (let i = 1; i < step; i++) {
      if (!stepValidation[i]) {
        toast({
          title: 'Cannot proceed',
          description: `Please complete Step ${i} first`,
          variant: 'destructive'
        })
        return
      }
    }
    setWizardState(prev => ({ ...prev, currentStep: step }))
  }

  const nextStep = () => {
    if (!stepValidation[wizardState.currentStep]) {
      toast({
        title: 'Incomplete step',
        description: 'Please complete all required fields',
        variant: 'destructive'
      })
      return
    }
    
    if (wizardState.currentStep < 6) {
      // If leaving Step 2 (Fill Information), save current template's formData
      if (wizardState.currentStep === 2) {
        const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]
        setWizardState(prev => ({
          ...prev,
          formDataByTemplate: {
            ...prev.formDataByTemplate,
            [currentTemplate.id]: prev.formData
          },
          currentStep: prev.currentStep + 1
        }))
      } else {
        setWizardState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
      }
    }
  }

  const prevStep = () => {
    if (wizardState.currentStep > 1) {
      setWizardState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))
    } else if (wizardState.currentStep === 1 && wizardState.selectedCategory) {
      // On step 1, if category is selected, go back to category selection
      setWizardState(prev => ({ ...prev, selectedCategory: null }))
    }
  }

  const saveDraft = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage for now (can be enhanced to save to backend)
      localStorage.setItem('wizardDraft', JSON.stringify(wizardState))
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelWizard = () => {
    if (wizardState.currentStep > 1 || wizardState.selectedTemplates.length > 0) {
      setShowCancelDialog(true)
    } else {
      resetWizard()
    }
  }

  const resetWizard = () => {
    setWizardState({
      currentStep: 1,
      selectedCategory: null,
      selectedTemplates: [],
      currentTemplateIndex: 0,
      formData: {},
      formDataByTemplate: {},
      selectedBranding: null,
      visualEffects: {
        filter: 'none',
        opacity: 100,
        blur: 0
      },
      promptInstructions: '',
      selectedPromptId: null,
      generatedContent: {
        content: '',
        caption: '',
        hashtags: ''
      },
      generatedContentByTemplate: {},
      generatedGraphicUrls: {},
      editableContentByPlatform: {},
      selectedPlatforms: [],
      selectedTeams: [],
      selectedTags: [],
      selectedProfileId: null,
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: '',
      isRecurring: false
    })
    setShowCancelDialog(false)
  }

  const categories = Array.from(new Set(templates.map(t => t.category)))
  const filteredTemplates = wizardState.selectedCategory
    ? templates.filter(t => t.category === wizardState.selectedCategory)
    : []

  const getFolderColor = (category: string) => {
    return folderColors[category.toLowerCase()] || { bg: 'bg-gray-50', icon: 'text-gray-500' }
  }

  const progress = (wizardState.currentStep / 6) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-gray-50 max-w-full overflow-hidden">
        {/* Rate Limit Warnings */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 space-y-4">
          <TwitterRateLimitBanner />
          <LateRateLimitBanner />
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200 py-3 lg:py-4 sticky top-0 lg:top-0 z-40">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="space-y-3 lg:space-y-4">
              {/* Header - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-tight">
                  Step {wizardState.currentStep} of 6: {STEPS[wizardState.currentStep - 1].title}
                </h2>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveDraft}
                    disabled={isSaving}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                    <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelWizard}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-1.5 sm:h-2" />
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                  <span>{progress.toFixed(0)}% complete</span>
                  <span>{STEPS[wizardState.currentStep - 1].description}</span>
                </div>
              </div>

              {/* Step indicators - Responsive Grid (2 rows on mobile, 1 row on larger screens) */}
              <div className="w-full">
                {/* Mobile: 2-row grid (3 steps per row) */}
                <div className="grid grid-cols-3 gap-x-1 gap-y-2 sm:hidden">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = wizardState.currentStep === step.id
                    const isCompleted = stepValidation[step.id]
                    const isPast = wizardState.currentStep > step.id
                    
                    return (
                      <Tooltip key={step.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => goToStep(step.id)}
                            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all ${
                              isActive
                                ? 'bg-blue-50 text-blue-600'
                                : isPast && isCompleted
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              isActive
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : isPast && isCompleted
                                ? 'border-green-600 bg-green-600 text-white'
                                : 'border-gray-300'
                            }`}>
                              {isPast && isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <StepIcon className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-[9px] font-medium text-center leading-tight px-0.5">{step.title}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{step.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>

                {/* Tablet & Desktop: Single row with connectors */}
                <div className="hidden sm:flex items-center justify-between">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = wizardState.currentStep === step.id
                    const isCompleted = stepValidation[step.id]
                    const isPast = wizardState.currentStep > step.id
                    
                    return (
                      <div key={step.id} className="flex items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => goToStep(step.id)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : isPast && isCompleted
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                isActive
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : isPast && isCompleted
                                  ? 'border-green-600 bg-green-600 text-white'
                                  : 'border-gray-300'
                              }`}>
                                {isPast && isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <StepIcon className="w-5 h-5" />
                                )}
                              </div>
                              <span className="text-xs font-medium hidden md:block">{step.title}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{step.description}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        {index < STEPS.length - 1 && (
                          <div className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 ${
                            isPast && isCompleted ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar - Mobile Responsive */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 sm:pb-28 lg:pb-32">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1">
              <StepContent
                wizardState={wizardState}
                setWizardState={setWizardState}
                templates={templates}
                categories={categories}
                filteredTemplates={filteredTemplates}
                getFolderColor={getFolderColor}
                toast={toast}
                teams={teams}
                brandings={brandings}
              />
            </div>

            {/* Sidebar Summary Panel - REMOVED per user request */}
            {/* <div className="w-80 hidden lg:block">
              <SidebarSummary wizardState={wizardState} stepValidation={stepValidation} />
            </div> */}
          </div>
        </div>

        {/* Navigation Footer - Mobile Responsive */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 sm:py-4 shadow-lg z-40">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={false}
                size="sm"
                className="gap-1 sm:gap-2 px-3 sm:px-4"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Status Message - Hidden on small mobile */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-2 flex-1 justify-center px-2">
                {!stepValidation[wizardState.currentStep] && (
                  <div className="flex items-center gap-1 sm:gap-2 text-amber-600">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm truncate">
                      <span className="hidden sm:inline">Complete this step to continue</span>
                      <span className="sm:hidden">Complete to continue</span>
                    </span>
                  </div>
                )}
                {stepValidation[wizardState.currentStep] && (
                  <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm">
                      <span className="hidden sm:inline">Step complete</span>
                      <span className="sm:hidden">Complete</span>
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={nextStep}
                disabled={!stepValidation[wizardState.currentStep] || wizardState.currentStep === 6}
                size="sm"
                className="gap-1 sm:gap-2 px-3 sm:px-4"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel wizard?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to cancel? All progress will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue editing</AlertDialogCancel>
              <AlertDialogAction onClick={resetWizard} className="bg-red-600 hover:bg-red-700">
                Yes, cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

// Step Content Component
function StepContent({ 
  wizardState, 
  setWizardState, 
  templates,
  categories,
  filteredTemplates,
  getFolderColor,
  toast,
  teams,
  brandings
}: any) {
  const { currentStep } = wizardState

  switch (currentStep) {
    case 1:
      return <Step1ChooseTemplate {...{ wizardState, setWizardState, categories, filteredTemplates, getFolderColor }} />
    case 2:
      return <Step2FillInformation {...{ wizardState, setWizardState, toast }} />
    case 3:
      return <Step3CustomizeDesign {...{ wizardState, setWizardState, brandings }} />
    case 4:
      return <Step4GenerateContent {...{ wizardState, setWizardState, toast, teams }} />
    case 5:
      return <Step5SelectPlatforms {...{ wizardState, setWizardState }} />
    case 6:
      return <Step6ScheduleReview {...{ wizardState, setWizardState, toast }} />
    default:
      return null
  }
}

// Sidebar Summary Component
function SidebarSummary({ wizardState, stepValidation }: any) {
  return (
    <Card className="sticky top-32">
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
        <CardDescription>Your progress at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates */}
        {wizardState.selectedTemplates.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">
              Selected Templates ({wizardState.selectedTemplates.length})
            </Label>
            <div className="relative aspect-square rounded-lg overflow-hidden border">
              <Image
                src={wizardState.selectedTemplates[wizardState.currentTemplateIndex]?.imageUrl || ''}
                alt={wizardState.selectedTemplates[wizardState.currentTemplateIndex]?.name || 'Template'}
                fill
                className="object-cover"
              />
            </div>
            <p className="font-medium text-sm">
              {wizardState.selectedTemplates[wizardState.currentTemplateIndex]?.name}
              {wizardState.selectedTemplates.length > 1 && (
                <Badge variant="secondary" className="ml-2">
                  {wizardState.currentTemplateIndex + 1}/{wizardState.selectedTemplates.length}
                </Badge>
              )}
            </p>
          </div>
        )}

        {/* Fields Progress */}
        {wizardState.selectedTemplates[wizardState.currentTemplateIndex]?.fields && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Form Fields</Label>
            <div className="flex items-center gap-2">
              {stepValidation[2] ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span className="text-sm">
                {Object.keys(wizardState.formData).filter(k => wizardState.formData[k]).length} / {wizardState.selectedTemplates[wizardState.currentTemplateIndex].fields.length} filled
              </span>
            </div>
          </div>
        )}

        {/* Platforms */}
        {wizardState.selectedPlatforms.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Platforms ({wizardState.selectedPlatforms.length})</Label>
            <div className="flex flex-wrap gap-2">
              {wizardState.selectedPlatforms.map((platform: string) => {
                const info = platformIcons[platform]
                return (
                  <Badge key={platform} variant="secondary" className="gap-1">
                    {info?.icon}
                    {info?.name}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Schedule Status */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Schedule</Label>
          <p className="text-sm">
            {wizardState.scheduleType === 'now' ? 'Post immediately' : 'Scheduled for later'}
          </p>
        </div>

        {/* Steps Checklist */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs text-gray-500">Checklist</Label>
          {STEPS.map(step => (
            <div key={step.id} className="flex items-center gap-2">
              {stepValidation[step.id] ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={`text-sm ${stepValidation[step.id] ? 'text-green-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Step 1: Choose Template
// Step 1: Choose Template (with bulk selection)
function Step1ChooseTemplate({ wizardState, setWizardState, categories, filteredTemplates, getFolderColor }: any) {
  const [searchTerm, setSearchTerm] = useState('')

  const selectCategory = (category: string) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      selectedCategory: category
    }))
  }

  const toggleTemplate = async (template: Template) => {
    // Check if template is already selected
    const isSelected = wizardState.selectedTemplates.some((t: Template) => t.id === template.id)
    
    if (isSelected) {
      // Remove from selection
      setWizardState((prev: WizardState) => ({
        ...prev,
        selectedTemplates: prev.selectedTemplates.filter((t: Template) => t.id !== template.id)
      }))
    } else {
      // Fetch full template with fields and add to selection
      try {
        const response = await fetch(`/api/templates/public/${template.id}`)
        if (response.ok) {
          const data = await response.json()
          const fullTemplate = data.template
          
          setWizardState((prev: WizardState) => ({
            ...prev,
            selectedTemplates: [...prev.selectedTemplates, fullTemplate]
          }))
        }
      } catch (error) {
        console.error('Error fetching template:', error)
      }
    }
  }

  const backToCategories = () => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      selectedCategory: null
    }))
  }

  const searchedTemplates = searchTerm
    ? filteredTemplates.filter((t: Template) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredTemplates

  if (!wizardState.selectedCategory) {
    // Show categories
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Choose a Category
          </CardTitle>
          <CardDescription>
            Select a template category to browse available templates
            {wizardState.selectedTemplates.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {wizardState.selectedTemplates.length} selected
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category: string) => {
              const colors = getFolderColor(category)
              // FIX: Use templates (full list) instead of filteredTemplates to count templates per category
              const categoryTemplates = templates.filter((t: Template) => t.category === category)
              
              return (
                <button
                  key={category}
                  onClick={() => selectCategory(category)}
                  className="text-left"
                >
                  <Card className="hover:shadow-lg transition-all hover:border-blue-300 cursor-pointer">
                    <CardContent className="p-0">
                      <div className={`${colors.bg} p-4 sm:p-6 lg:p-8 flex items-center justify-center border-b`}>
                        <Folder className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 ${colors.icon}`} />
                      </div>
                      <div className="p-2 sm:p-3 lg:p-4">
                        <h3 className="font-bold uppercase text-[10px] sm:text-xs lg:text-sm mb-0.5 sm:mb-1 truncate">{category}</h3>
                        <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500">{categoryTemplates.length} templates</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show templates in category with bulk selection
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="sm" onClick={backToCategories} className="gap-1 sm:gap-2 px-2 sm:px-3">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Back</span>
          </Button>
          <h2 className="text-base sm:text-lg lg:text-xl font-bold capitalize truncate">{wizardState.selectedCategory} Templates</h2>
        </div>
        {wizardState.selectedTemplates.length > 0 && (
          <Badge variant="default" className="gap-1 sm:gap-2 self-start sm:self-auto">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{wizardState.selectedTemplates.length} selected</span>
          </Badge>
        )}
      </div>

      {/* Search Box */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {searchedTemplates.map((template: Template) => {
          const isSelected = wizardState.selectedTemplates.some((t: Template) => t.id === template.id)
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer hover:shadow-lg transition-all ${
                isSelected
                  ? 'border-2 border-blue-500 ring-2 ring-blue-200'
                  : 'hover:border-blue-300'
              }`}
              onClick={() => toggleTemplate(template)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={template.imageUrl}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-blue-600 text-white rounded-full p-1.5 sm:p-2">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                    <Checkbox checked={isSelected} className="bg-white h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold mb-0.5 sm:mb-1 text-sm sm:text-base truncate">{template.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
// Step 2: Fill Information (Placeholder)
// Step 2: Fill Information (with uploads and preview)
function Step2FillInformation({ wizardState, setWizardState, toast }: any) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  if (wizardState.selectedTemplates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Please select a template first</p>
        </CardContent>
      </Card>
    )
  }

  const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]
  
  // Debounced canvas rendering - updates after typing stops
  const formDataString = JSON.stringify(wizardState.formData)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      renderCanvasPreview()
    }, 1000) // Wait 1 second after last keystroke
    
    return () => clearTimeout(timeoutId)
  }, [formDataString, currentTemplate])
  
  const renderCanvasPreview = async () => {
    console.log('🎨 renderCanvasPreview CALLED')
    
    if (!canvasRef.current || !currentTemplate) {
      console.log('❌ Canvas preview skipped - no canvas or template', {
        hasCanvas: !!canvasRef.current,
        hasTemplate: !!currentTemplate
      })
      return
    }
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Failed to get 2D context')
      return
    }
    
    // Set canvas dimensions
    canvas.width = currentTemplate.width || 1080
    canvas.height = currentTemplate.height || 1080
    
    console.log('✅ Canvas setup complete:', { 
      width: canvas.width, 
      height: canvas.height,
      formDataKeys: Object.keys(wizardState.formData),
      formData: wizardState.formData,
      fieldCount: currentTemplate.fields?.length || 0,
      fields: currentTemplate.fields 
    })
    
    // Clear with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Load and draw template image
    const templateImg = new window.Image()
    templateImg.crossOrigin = 'anonymous'
    
    templateImg.onload = async () => {
      console.log('Template image loaded successfully')
      
      // Draw template background
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)
      
      // Draw all fields on top
      if (currentTemplate.fields && Array.isArray(currentTemplate.fields)) {
        console.log('Drawing fields:', currentTemplate.fields.length)
        
        for (const field of currentTemplate.fields) {
          const value = wizardState.formData[field.fieldName]
          
          console.log('🔍 Processing field:', {
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            fieldLabel: field.fieldLabel,
            hasValue: !!value,
            valuePreview: value ? (typeof value === 'string' && value.startsWith('http') ? value.substring(0, 80) + '...' : value) : 'NO VALUE',
            isMedia: isMediaField(field),
            position: { x: field.x, y: field.y, w: field.width, h: field.height }
          })
          
          if (!value) {
            console.log('⏭️ Skipping field (no value):', field.fieldName)
            continue
          }
          
          if (isMediaField(field)) {
            console.log('🖼️ THIS IS A MEDIA FIELD - starting image load for:', field.fieldName)
            // Draw image/video field with fallback loading
            try {
              console.log('Loading image for field:', field.fieldName, {
                url: value,
                urlLength: value.length,
                urlStart: value.substring(0, 100)
              })
              
              // Convert S3 URLs or cloud_storage_paths to use proxy endpoint (bypasses CORS)
              let imageUrl = value
              if (value.includes('amazonaws.com') || value.includes('s3.') || value.includes('/uploads/') || value.startsWith('6788/')) {
                // Pass the URL or cloud_storage_path to the proxy endpoint
                imageUrl = `/api/upload/image?path=${encodeURIComponent(value)}`
                console.log('🔄 Using proxy endpoint for image:', imageUrl)
                console.log('📌 Original value:', value.substring(0, 80))
              }
              
              const fieldImg = new window.Image()
              let imageLoaded = false
              
              // Try Method 1: Fetch as blob (best for CORS)
              try {
                console.log('📥 Attempting BLOB fetch for:', imageUrl.substring(0, 80))
                const response = await fetch(imageUrl, {
                  mode: 'cors',
                  credentials: 'omit'
                })
                
                console.log('📥 Fetch response:', {
                  ok: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  contentType: response.headers.get('content-type')
                })
                
                if (response.ok) {
                  const blob = await response.blob()
                  const objectUrl = URL.createObjectURL(blob)
                  
                  console.log('✅ Image fetched as blob successfully, size:', blob.size, 'bytes')
                  console.log('🔗 Created object URL:', objectUrl.substring(0, 50))
                  
                  await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                      URL.revokeObjectURL(objectUrl)
                      reject(new Error('Blob load timeout after 8s'))
                    }, 8000)
                    
                    fieldImg.onload = () => {
                      clearTimeout(timeout)
                      console.log('✅✅ Blob image LOADED successfully:', field.fieldName, {
                        naturalWidth: fieldImg.naturalWidth,
                        naturalHeight: fieldImg.naturalHeight
                      })
                      imageLoaded = true
                      resolve(null)
                    }
                    fieldImg.onerror = (err) => {
                      clearTimeout(timeout)
                      URL.revokeObjectURL(objectUrl)
                      console.error('❌ Blob image.onload failed:', err)
                      reject(err)
                    }
                    
                    console.log('🖼️ Setting fieldImg.src to object URL...')
                    fieldImg.src = objectUrl
                  })
                  
                  URL.revokeObjectURL(objectUrl)
                  console.log('🧹 Object URL revoked')
                } else {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
              } catch (blobError) {
                console.warn('⚠️ Blob loading failed, trying direct load:', blobError)
                
                // Method 2: Direct image load with crossOrigin (fallback)
                fieldImg.crossOrigin = 'anonymous'
                console.log('🔄 Attempting DIRECT image load with crossOrigin=anonymous')
                
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    console.error('❌ Direct load TIMEOUT after 8s')
                    reject(new Error('Direct load timeout after 8s'))
                  }, 8000)
                  
                  fieldImg.onload = () => {
                    clearTimeout(timeout)
                    console.log('✅✅ Direct image LOADED successfully:', field.fieldName, {
                      naturalWidth: fieldImg.naturalWidth,
                      naturalHeight: fieldImg.naturalHeight
                    })
                    imageLoaded = true
                    resolve(null)
                  }
                  fieldImg.onerror = (err) => {
                    clearTimeout(timeout)
                    console.error('❌ Direct image.onload failed:', err)
                    reject(err)
                  }
                  
                  console.log('🖼️ Setting fieldImg.src directly to:', imageUrl.substring(0, 80))
                  fieldImg.src = imageUrl
                })
              }
              
              // Draw the image if loaded
              if (imageLoaded) {
                console.log('🎨 DRAWING image to canvas at:', { 
                  x: field.x, 
                  y: field.y, 
                  w: field.width, 
                  h: field.height,
                  imgDimensions: { w: fieldImg.naturalWidth, h: fieldImg.naturalHeight }
                })
                ctx.drawImage(fieldImg, field.x, field.y, field.width, field.height)
                console.log('✅✅✅ IMAGE DRAWN SUCCESSFULLY!')
              } else {
                console.error('❌❌ imageLoaded is FALSE - both methods failed')
                throw new Error('Image failed to load with both methods')
              }
              
            } catch (err) {
              console.error('❌❌❌ FAILED to load/draw image for field:', field.fieldName, {
                error: err,
                url: value,
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined
              })
              // Draw error placeholder with more info
              ctx.fillStyle = '#FEE2E2'
              ctx.fillRect(field.x, field.y, field.width, field.height)
              ctx.fillStyle = '#EF4444'
              ctx.font = '12px Arial'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('Image Load Failed', field.x + field.width / 2, field.y + field.height / 2 - 10)
              ctx.font = '10px Arial'
              ctx.fillText('Check console for details', field.x + field.width / 2, field.y + field.height / 2 + 10)
            }
          } else {
            // Draw text field at exact position
            ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`
            ctx.fillStyle = field.fontColor || '#000000'
            
            // Determine text alignment and x position
            const textAlign = (field.textAlign as CanvasTextAlign) || 'center'
            ctx.textAlign = textAlign
            ctx.textBaseline = 'middle' // Use 'middle' for vertical centering
            
            // Calculate x position based on alignment
            let textX = field.x
            if (textAlign === 'center') {
              textX = field.x + field.width / 2
            } else if (textAlign === 'right') {
              textX = field.x + field.width
            }
            
            // Calculate y position for vertical centering
            const textY = field.y + field.height / 2
            
            console.log('Drawing text with:', {
              font: ctx.font,
              color: ctx.fillStyle,
              align: textAlign,
              position: { x: textX, y: textY },
              fieldBounds: { x: field.x, y: field.y, w: field.width, h: field.height }
            })
            
            // Handle multi-line text
            const lines = value.toString().split('\n')
            const lineHeight = (field.fontSize || 24) + 5
            const totalHeight = lines.length * lineHeight
            const startY = textY - (totalHeight / 2) + (lineHeight / 2)
            
            lines.forEach((line: string, index: number) => {
              const y = startY + (index * lineHeight)
              ctx.fillText(line, textX, y)
              console.log('Drew text line:', line, 'at x:', textX, 'y:', y)
            })
          }
        }
        
        console.log('Finished drawing all fields')
      } else {
        console.warn('No fields array found in template')
      }

      // Capture canvas as data URL and store it
      try {
        const dataUrl = canvas.toDataURL('image/png')
        setWizardState((prev: WizardState) => ({
          ...prev,
          generatedGraphicUrls: {
            ...prev.generatedGraphicUrls,
            [currentTemplate.id]: dataUrl
          }
        }))
        console.log('✅ Captured main canvas graphic URL for template:', currentTemplate.name)
      } catch (err) {
        console.error('❌ Failed to capture main canvas data URL:', err)
      }
    }
    
    templateImg.onerror = (err) => {
      console.error('Template image failed to load:', err)
      ctx.fillStyle = '#EF4444'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '20px Arial'
      ctx.fillText('Failed to load template image', canvas.width / 2, canvas.height / 2)
    }
    
    const imageUrl = `/api/templates/${currentTemplate.id}/image`
    console.log('Loading template image from:', imageUrl)
    templateImg.src = imageUrl
  }
  
  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploading({ ...uploading, [fieldName]: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setWizardState((prev: WizardState) => ({
          ...prev,
          formData: { ...prev.formData, [fieldName]: data.url }
        }))
        toast({ title: 'File uploaded successfully!' })
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({ title: 'Upload error', variant: 'destructive' })
    } finally {
      setUploading({ ...uploading, [fieldName]: false })
    }
  }

  const isMediaField = (field: TemplateField) => {
    // Check fieldType first (most reliable)
    if (field.fieldType === 'image' || field.fieldType === 'video' || field.fieldType === 'media') {
      return true
    }
    
    // Check fieldLabel and fieldName for keywords
    const lowerLabel = field.fieldLabel.toLowerCase()
    const lowerName = field.fieldName.toLowerCase()
    const keywords = ['image', 'photo', 'picture', 'video', 'media']
    
    return keywords.some(keyword => 
      lowerLabel.includes(keyword) || lowerName.includes(keyword)
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Fill Template Information
          </CardTitle>
          <CardDescription>
            Template {wizardState.currentTemplateIndex + 1} of {wizardState.selectedTemplates.length}: {currentTemplate.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentTemplate.fields?.map((field: TemplateField) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.fieldName}>
                {field.fieldLabel}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {isMediaField(field) ? (
                <div className="space-y-2">
                  <Input
                    id={field.fieldName}
                    type="text"
                    value={wizardState.formData[field.fieldName] || ''}
                    onChange={(e) =>
                      setWizardState((prev: WizardState) => ({
                        ...prev,
                        formData: { ...prev.formData, [field.fieldName]: e.target.value }
                      }))
                    }
                    placeholder="Enter URL or upload file..."
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploading[field.fieldName]}
                      onClick={() => document.getElementById(`upload-${field.fieldName}`)?.click()}
                      className="gap-2"
                    >
                      {uploading[field.fieldName] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload {field.fieldType === 'video' || field.fieldLabel.toLowerCase().includes('video') || field.fieldName.toLowerCase().includes('video') ? 'Video' : 'Image'}
                        </>
                      )}
                    </Button>
                    <input
                      id={`upload-${field.fieldName}`}
                      type="file"
                      accept={field.fieldType === 'video' || field.fieldLabel.toLowerCase().includes('video') || field.fieldName.toLowerCase().includes('video') ? 'video/*' : 'image/*'}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(field.fieldName, file)
                      }}
                    />
                    {wizardState.formData[field.fieldName] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWizardState((prev: WizardState) => ({
                          ...prev,
                          formData: { ...prev.formData, [field.fieldName]: '' }
                        }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {wizardState.formData[field.fieldName] && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={`/api/upload/image?path=${encodeURIComponent(wizardState.formData[field.fieldName])}`}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              ) : field.fieldType === 'textarea' ? (
                <Textarea
                  id={field.fieldName}
                  value={wizardState.formData[field.fieldName] || ''}
                  onChange={(e) =>
                    setWizardState((prev: WizardState) => ({
                      ...prev,
                      formData: { ...prev.formData, [field.fieldName]: e.target.value }
                    }))
                  }
                  placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
                  className="min-h-[100px]"
                />
              ) : (
                <Input
                  id={field.fieldName}
                  type={field.fieldType === 'number' ? 'number' : 'text'}
                  value={wizardState.formData[field.fieldName] || ''}
                  onChange={(e) =>
                    setWizardState((prev: WizardState) => ({
                      ...prev,
                      formData: { ...prev.formData, [field.fieldName]: e.target.value }
                    }))
                  }
                  placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
          
          {/* Template navigation for multiple templates */}
          {wizardState.selectedTemplates.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={wizardState.currentTemplateIndex === 0}
                onClick={() => {
                  const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]
                  const prevIndex = wizardState.currentTemplateIndex - 1
                  const prevTemplate = wizardState.selectedTemplates[prevIndex]
                  
                  setWizardState((prev: WizardState) => ({
                    ...prev,
                    // Save current template's data
                    formDataByTemplate: {
                      ...prev.formDataByTemplate,
                      [currentTemplate.id]: prev.formData
                    },
                    // Load previous template's data
                    formData: prev.formDataByTemplate[prevTemplate.id] || {},
                    currentTemplateIndex: prevIndex
                  }))
                }}
              >
                ← Previous Template
              </Button>
              <span className="text-sm text-gray-600">
                {wizardState.currentTemplateIndex + 1} / {wizardState.selectedTemplates.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={wizardState.currentTemplateIndex === wizardState.selectedTemplates.length - 1}
                onClick={() => {
                  const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]
                  const nextIndex = wizardState.currentTemplateIndex + 1
                  const nextTemplate = wizardState.selectedTemplates[nextIndex]
                  
                  setWizardState((prev: WizardState) => ({
                    ...prev,
                    // Save current template's data
                    formDataByTemplate: {
                      ...prev.formDataByTemplate,
                      [currentTemplate.id]: prev.formData
                    },
                    // Load next template's data
                    formData: prev.formDataByTemplate[nextTemplate.id] || {},
                    currentTemplateIndex: nextIndex
                  }))
                }}
              >
                Next Template →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview Section */}
      <Card className="lg:sticky lg:top-24 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            Real-time preview with your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-white rounded-lg overflow-hidden border-2 border-gray-200">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ minHeight: '400px' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Preview shows your text and images at their exact positions on the template.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
// Placeholder components for other steps
// Step 3: Customize Design (Full Implementation)
function Step3CustomizeDesign({ wizardState, setWizardState, brandings }: any) {
  const [uploadingOverlay, setUploadingOverlay] = useState(false)
  const [customOverlayUrl, setCustomOverlayUrl] = useState('')
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  const currentTemplate = wizardState.selectedTemplates[wizardState.currentTemplateIndex]

  const isMediaField = (field: TemplateField) => {
    return field.fieldType === 'image' || field.fieldType === 'video' ||
           field.fieldLabel.toLowerCase().includes('image') || 
           field.fieldLabel.toLowerCase().includes('video') ||
           field.fieldName.toLowerCase().includes('image') ||
           field.fieldName.toLowerCase().includes('video')
  }

  // Debounced template preview rendering
  const formDataByTemplateString = JSON.stringify(wizardState.formDataByTemplate)
  const visualEffectsString = JSON.stringify(wizardState.visualEffects)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      wizardState.selectedTemplates.forEach((template: Template, index: number) => {
        renderTemplatePreview(template, index)
      })
    }, 1000) // Wait 1 second after last change
    
    return () => clearTimeout(timeoutId)
  }, [wizardState.selectedTemplates, formDataByTemplateString, visualEffectsString])

  const renderTemplatePreview = async (template: Template, index: number) => {
    const canvas = canvasRefs.current[index]
    if (!canvas || !template) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = template.width || 1080
    canvas.height = template.height || 1080

    // Clear canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load template image
    const templateImg = new window.Image()
    templateImg.crossOrigin = 'anonymous'

    templateImg.onload = async () => {
      // Draw template
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

      // Get form data for this specific template
      const formData = wizardState.formDataByTemplate?.[template.id] || {}

      // Draw fields with data
      if (template.fields && Array.isArray(template.fields)) {
        for (const field of template.fields as any[]) {
          const value = formData[field.fieldName]
          if (!value) continue

          if (isMediaField(field)) {
            // Draw image with fallback - use proxy endpoint for CORS compliance
            try {
              const fieldImg = new window.Image()
              let imageLoaded = false
              
              // Convert to proxy URL if needed
              let imageUrl = value
              if (value.includes('amazonaws.com') || value.includes('s3.') || value.includes('/uploads/') || value.startsWith('6788/')) {
                imageUrl = `/api/upload/image?path=${encodeURIComponent(value)}`
                console.log('🔄 [Step 3] Using proxy for image:', value.substring(0, 50))
              }
              
              // Try blob loading first
              try {
                const response = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' })
                if (response.ok) {
                  const blob = await response.blob()
                  const objectUrl = URL.createObjectURL(blob)

                  await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                      URL.revokeObjectURL(objectUrl)
                      reject(new Error('Blob timeout'))
                    }, 8000)
                    
                    fieldImg.onload = () => {
                      clearTimeout(timeout)
                      imageLoaded = true
                      resolve(null)
                    }
                    fieldImg.onerror = (err) => {
                      clearTimeout(timeout)
                      URL.revokeObjectURL(objectUrl)
                      reject(err)
                    }
                    fieldImg.src = objectUrl
                  })

                  URL.revokeObjectURL(objectUrl)
                }
              } catch (blobError) {
                // Fallback to direct load
                console.warn('Blob failed, trying direct:', blobError)
                fieldImg.crossOrigin = 'anonymous'
                
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Direct timeout')), 8000)
                  fieldImg.onload = () => {
                    clearTimeout(timeout)
                    imageLoaded = true
                    resolve(null)
                  }
                  fieldImg.onerror = (err) => {
                    clearTimeout(timeout)
                    reject(err)
                  }
                  fieldImg.src = imageUrl
                })
              }
              
              if (imageLoaded) {
                ctx.drawImage(fieldImg, field.x, field.y, field.width, field.height)
              }
            } catch (err) {
              console.error('Failed to load image:', err)
              // Draw placeholder
              ctx.fillStyle = '#FEE2E2'
              ctx.fillRect(field.x, field.y, field.width, field.height)
            }
          } else {
            // Draw text
            ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`
            ctx.fillStyle = field.fontColor || '#000000'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const textX = field.x + field.width / 2
            const textY = field.y + field.height / 2
            ctx.fillText(value.toString(), textX, textY)
          }
        }
      }

      // Apply visual effects
      if (wizardState.visualEffects.filter && wizardState.visualEffects.filter !== 'none') {
        // Effects would be applied here (simplified for now)
      }

      // Capture canvas as data URL and store it
      try {
        const dataUrl = canvas.toDataURL('image/png')
        setWizardState((prev: WizardState) => ({
          ...prev,
          generatedGraphicUrls: {
            ...prev.generatedGraphicUrls,
            [template.id]: dataUrl
          }
        }))
        console.log('✅ Captured graphic URL for template:', template.name)
      } catch (err) {
        console.error('❌ Failed to capture canvas data URL:', err)
      }
    }

    templateImg.src = `/api/templates/${template.id}/image`
  }

  const filters = [
    { id: 'none', name: 'No Filter', preview: 'Original' },
    { id: 'grayscale', name: 'Grayscale', preview: 'B&W' },
    { id: 'sepia', name: 'Sepia', preview: 'Vintage' },
    { id: 'blur', name: 'Blur', preview: 'Soft' },
    { id: 'brightness', name: 'Brighten', preview: 'Light' },
    { id: 'contrast', name: 'High Contrast', preview: 'Bold' },
    { id: 'saturate', name: 'Saturate', preview: 'Vibrant' },
    { id: 'invert', name: 'Invert', preview: 'Negative' }
  ]

  const textures = [
    { id: 'none', name: 'No Texture' },
    { id: 'paper', name: 'Paper Texture' },
    { id: 'grunge', name: 'Grunge' },
    { id: 'canvas', name: 'Canvas' },
    { id: 'noise', name: 'Film Grain' }
  ]

  const photoEffects = [
    { id: 'none', name: 'No Effect' },
    { id: 'vignette', name: 'Vignette' },
    { id: 'glow', name: 'Soft Glow' },
    { id: 'sharpen', name: 'Sharpen' },
    { id: 'hdr', name: 'HDR' }
  ]

  const handleBrandingSelect = (brandingId: string) => {
    const selected = brandings.find((b: any) => b.id === brandingId)
    setWizardState((prev: WizardState) => ({
      ...prev,
      selectedBranding: selected || null
    }))
  }

  const handleFilterChange = (filterId: string) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      visualEffects: {
        ...prev.visualEffects,
        filter: filterId
      }
    }))
  }

  const handleOpacityChange = (value: number[]) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      visualEffects: {
        ...prev.visualEffects,
        opacity: value[0]
      }
    }))
  }

  const handleBlurChange = (value: number[]) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      visualEffects: {
        ...prev.visualEffects,
        blur: value[0]
      }
    }))
  }

  const handleOverlayUpload = async (file: File) => {
    setUploadingOverlay(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomOverlayUrl(data.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploadingOverlay(false)
    }
  }

  const getFilterStyle = (filter: string) => {
    const styles: Record<string, React.CSSProperties> = {
      grayscale: { filter: 'grayscale(100%)' },
      sepia: { filter: 'sepia(100%)' },
      blur: { filter: 'blur(2px)' },
      brightness: { filter: 'brightness(1.2)' },
      contrast: { filter: 'contrast(1.3)' },
      saturate: { filter: 'saturate(1.5)' },
      invert: { filter: 'invert(100%)' }
    }
    return styles[filter] || {}
  }

  return (
    <div className="space-y-6">
      {/* Branding Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Apply Workspace Branding
          </CardTitle>
          <CardDescription>
            Add your team logos, colors, and brand elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Select Branding Profile</Label>
            <Select
              value={wizardState.selectedBranding?.id || 'none'}
              onValueChange={handleBrandingSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a branding profile..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Branding</SelectItem>
                {brandings.map((branding: any) => (
                  <SelectItem key={branding.id} value={branding.id}>
                    {branding.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {wizardState.selectedBranding && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm">Branding Preview</h4>
              <div className="grid grid-cols-2 gap-4">
                {wizardState.selectedBranding.primaryLogoUrl && (
                  <div>
                    <Label className="text-xs text-gray-500">Primary Logo</Label>
                    <div className="relative h-20 bg-white rounded border mt-1">
                      <Image
                        src={wizardState.selectedBranding.primaryLogoUrl}
                        alt="Primary Logo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                )}
                {wizardState.selectedBranding.secondaryLogoUrl && (
                  <div>
                    <Label className="text-xs text-gray-500">Secondary Logo</Label>
                    <div className="relative h-20 bg-white rounded border mt-1">
                      <Image
                        src={wizardState.selectedBranding.secondaryLogoUrl}
                        alt="Secondary Logo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
              {wizardState.selectedBranding.primaryColor && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: wizardState.selectedBranding.primaryColor }}
                  />
                  <span className="text-sm">{wizardState.selectedBranding.primaryColor}</span>
                </div>
              )}
            </div>
          )}

          {brandings.length === 0 && (
            <p className="text-sm text-gray-500">
              No branding profiles available. Create one in Workspace Settings.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Visual Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Visual Filters
          </CardTitle>
          <CardDescription>Apply filters to enhance your image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  wizardState.visualEffects.filter === filter.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm mb-1">{filter.name}</div>
                  <div className="text-xs text-gray-500">{filter.preview}</div>
                </div>
              </button>
            ))}
          </div>

          {wizardState.visualEffects.filter !== 'none' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Filter Applied</AlertTitle>
              <AlertDescription>
                {filters.find(f => f.id === wizardState.visualEffects.filter)?.name} is active
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Opacity & Blur Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Advanced Effects
          </CardTitle>
          <CardDescription>Fine-tune opacity and blur settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Opacity</Label>
              <span className="text-sm text-gray-500">{wizardState.visualEffects.opacity}%</span>
            </div>
            <Slider
              value={[wizardState.visualEffects.opacity]}
              onValueChange={handleOpacityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Blur</Label>
              <span className="text-sm text-gray-500">{wizardState.visualEffects.blur}px</span>
            </div>
            <Slider
              value={[wizardState.visualEffects.blur]}
              onValueChange={handleBlurChange}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Overlay Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Custom Overlay/Texture
          </CardTitle>
          <CardDescription>
            Upload a custom image to overlay on your template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={uploadingOverlay}
              onClick={() => document.getElementById('overlay-upload')?.click()}
              className="gap-2"
            >
              {uploadingOverlay ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Overlay Image
                </>
              )}
            </Button>
            <input
              id="overlay-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleOverlayUpload(file)
              }}
            />
          </div>

          {customOverlayUrl && (
            <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={customOverlayUrl}
                alt="Custom Overlay"
                fill
                className="object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setCustomOverlayUrl('')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Templates Preview Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Your Designs ({wizardState.selectedTemplates.length})
          </CardTitle>
          <CardDescription>All templates with your filled data and applied effects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wizardState.selectedTemplates.map((template: Template, index: number) => (
              <div key={template.id} className="space-y-2">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <div className="relative w-full bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                  <canvas
                    ref={(el) => (canvasRefs.current[index] = el)}
                    className="w-full h-auto"
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Step 4: Generate Content (with prompts and team tagging)
function Step4GenerateContent({ wizardState, setWizardState, toast, teams }: any) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [prompts, setPrompts] = useState<any[]>([])
  const [loadingPrompts, setLoadingPrompts] = useState(false)

  // Load saved prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoadingPrompts(true)
      try {
        const response = await fetch('/api/prompts')
        if (response.ok) {
          const data = await response.json()
          setPrompts(data.prompts || [])
        }
      } catch (error) {
        console.error('Error loading prompts:', error)
      } finally {
        setLoadingPrompts(false)
      }
    }
    fetchPrompts()
  }, [])

  const enhancePrompt = async () => {
    if (!wizardState.promptInstructions.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt first',
        variant: 'destructive'
      })
      return
    }

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/polish-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: wizardState.promptInstructions,
          isInstructions: true,
          platforms: wizardState.selectedPlatforms
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let enhancedText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                if (parsed.status === 'completed') {
                  enhancedText = parsed.content
                  break
                } else if (parsed.status === 'streaming' && parsed.content) {
                  enhancedText += parsed.content
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      if (enhancedText.trim()) {
        setWizardState((prev: WizardState) => ({
          ...prev,
          promptInstructions: enhancedText.trim()
        }))
        toast({
          title: 'Prompt enhanced!',
          description: 'Your prompt has been improved by AI'
        })
      } else {
        throw new Error('No enhanced content received')
      }
    } catch (error) {
      console.error('Enhance prompt error:', error)
      toast({
        title: 'Error',
        description: 'Failed to enhance prompt',
        variant: 'destructive'
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const generateContent = async () => {
    setIsGenerating(true)
    try {
      // Generate content for EACH template
      const contentByTemplate: Record<string, { content: string, caption: string, hashtags: string }> = {}
      
      for (const template of wizardState.selectedTemplates) {
        const templateData = wizardState.formDataByTemplate[template.id] || {}
        
        // Collect media URLs from template data
        const mediaUrls: string[] = []
        const mediaTypes: string[] = []
        
        if (template.fields && Array.isArray(template.fields)) {
          for (const field of template.fields as any[]) {
            const value = templateData[field.fieldName]
            if (value && (field.fieldType === 'image' || field.fieldType === 'media')) {
              mediaUrls.push(value)
              mediaTypes.push('image')
            }
          }
        }
        
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateData,
            templateName: template.name,
            promptInstructions: wizardState.promptInstructions || 'Generate engaging social media content',
            platforms: wizardState.selectedPlatforms,
            hasMedia: mediaUrls.length > 0,
            mediaUrls,
            mediaTypes
          })
        })
        
        if (response.ok) {
          // Handle streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''
          
          if (reader) {
            let partialRead = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              partialRead += decoder.decode(value, { stream: true })
              let lines = partialRead.split('\n')
              partialRead = lines.pop() || ''
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') break
                  
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.status === 'completed') {
                      fullContent = parsed.content || ''
                    } else if (parsed.status === 'streaming') {
                      // Accumulate streaming content
                      fullContent += parsed.content || ''
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
          
          // Split content into main post, caption, and hashtags
          // For now, use the full content as the post
          contentByTemplate[template.id] = {
            content: fullContent || '',
            caption: `Check out this ${template.name}!`,
            hashtags: '#socialmedia #content'
          }
        } else {
          const errorText = await response.text()
          console.error('Generation error:', errorText)
          throw new Error(`Generation failed for template: ${template.name}`)
        }
      }
      
      setWizardState((prev: WizardState) => ({
        ...prev,
        generatedContentByTemplate: contentByTemplate
      }))
      
      toast({
        title: 'Content generated!',
        description: `Generated content for ${wizardState.selectedTemplates.length} template(s)`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePromptSelect = (promptId: string) => {
    if (promptId === 'custom') {
      setWizardState((prev: WizardState) => ({
        ...prev,
        selectedPromptId: null,
        promptInstructions: ''
      }))
    } else {
      const selectedPrompt = prompts.find(p => p.id === promptId)
      if (selectedPrompt) {
        setWizardState((prev: WizardState) => ({
          ...prev,
          selectedPromptId: promptId,
          promptInstructions: selectedPrompt.prompt
        }))
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Social Content
          </CardTitle>
          <CardDescription>Create AI-powered post content, captions, and hashtags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Selection */}
          <div className="space-y-3">
            <Label>Select a Prompt Template</Label>
            <Select
              value={wizardState.selectedPromptId || 'custom'}
              onValueChange={handlePromptSelect}
              disabled={loadingPrompts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingPrompts ? 'Loading prompts...' : 'Choose a saved prompt or write custom'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Prompt</SelectItem>
                {prompts.map(prompt => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Instructions */}
          <div className="space-y-3">
            <Label htmlFor="promptInstructions">
              Prompt Instructions
              <span className="text-sm text-gray-500 ml-2">(Guide the AI generation)</span>
            </Label>
            <Textarea
              id="promptInstructions"
              value={wizardState.promptInstructions}
              onChange={(e) =>
                setWizardState((prev: WizardState) => ({
                  ...prev,
                  promptInstructions: e.target.value,
                  selectedPromptId: null // Clear selection when typing custom
                }))
              }
              placeholder="E.g., Create an exciting announcement post with emojis, keep it under 280 characters..."
              className="min-h-[120px]"
            />
            {/* Enhance Prompt Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={enhancePrompt}
              disabled={isEnhancing || !wizardState.promptInstructions.trim()}
              className="gap-2"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Enhance Prompt
                </>
              )}
            </Button>
          </div>

          {/* Team Tagging - DROPDOWN */}
          <div className="space-y-3">
            <Label>Tag Teams / People</Label>
            <Select
              value={wizardState.selectedTeams[0] || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setWizardState((prev: WizardState) => ({
                    ...prev,
                    selectedTeams: []
                  }))
                } else {
                  setWizardState((prev: WizardState) => ({
                    ...prev,
                    selectedTeams: [value]
                  }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={teams.length === 0 ? 'No teams created' : 'Select a team to tag'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team (don't tag anyone)</SelectItem>
                {teams.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.members?.length || 0} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {wizardState.selectedTeams.length > 0 && wizardState.selectedTeams[0] !== 'none' && (
              <div className="text-xs text-gray-600 mt-2">
                Selected team will be tagged in the post
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateContent} 
            disabled={isGenerating || !wizardState.promptInstructions.trim()}
            className="gap-2 w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content Display - FOR EACH TEMPLATE */}
      {Object.keys(wizardState.generatedContentByTemplate).length > 0 && (
        <div className="space-y-4">
          {wizardState.selectedTemplates.map((template: Template) => {
            const content = wizardState.generatedContentByTemplate[template.id]
            if (!content) return null
            
            // Get the generated graphic URL from formDataByTemplate
            const templateData = wizardState.formDataByTemplate[template.id] || {}
            let graphicPreviewUrl: string | null = null
            
            // Find the first image field in the template data
            if (template.fields && Array.isArray(template.fields)) {
              for (const field of template.fields as any[]) {
                const value = templateData[field.fieldName]
                if (value && (field.fieldType === 'image' || field.fieldType === 'media')) {
                  // Use proxy endpoint for CORS compliance
                  graphicPreviewUrl = `/api/upload/image?path=${encodeURIComponent(value)}`
                  break
                }
              }
            }
            
            return (
              <Card key={template.id} className="border-green-500">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Generated Content: {template.name}
                  </CardTitle>
                  <CardDescription>Edit the generated content as needed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Template Graphic Preview */}
                  {graphicPreviewUrl && (
                    <div className="space-y-2">
                      <Label>Generated Graphic</Label>
                      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={graphicPreviewUrl}
                          alt={`Generated graphic for ${template.name}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Failed to load graphic preview:', graphicPreviewUrl)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Post Content</Label>
                    <Textarea
                      value={content.content}
                      onChange={(e) =>
                        setWizardState((prev: WizardState) => ({
                          ...prev,
                          generatedContentByTemplate: {
                            ...prev.generatedContentByTemplate,
                            [template.id]: { ...content, content: e.target.value }
                          }
                        }))
                      }
                      className="mt-2 min-h-[120px]"
                      placeholder="Generated post content will appear here..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {content.content.length} characters
                    </div>
                  </div>
                  <div>
                    <Label>Caption</Label>
                    <Input
                      value={content.caption}
                      onChange={(e) =>
                        setWizardState((prev: WizardState) => ({
                          ...prev,
                          generatedContentByTemplate: {
                            ...prev.generatedContentByTemplate,
                            [template.id]: { ...content, caption: e.target.value }
                          }
                        }))
                      }
                      className="mt-2"
                      placeholder="Engaging caption for your post"
                    />
                  </div>
                  <div>
                    <Label>Hashtags</Label>
                    <Input
                      value={content.hashtags}
                      onChange={(e) =>
                        setWizardState((prev: WizardState) => ({
                          ...prev,
                          generatedContentByTemplate: {
                            ...prev.generatedContentByTemplate,
                            [template.id]: { ...content, hashtags: e.target.value }
                          }
                        }))
                      }
                      className="mt-2"
                      placeholder="#example #hashtags #here"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
function Step5SelectPlatforms({ wizardState, setWizardState }: any) {
  const [profiles, setProfiles] = useState<Array<{ id: string, name: string }>>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        // Try optimized fetch first
        const result = await fetchProfilesOptimized()

        if (result.success && result.data) {
          const profilesArray = result.data
          setProfiles(profilesArray)
          // Auto-select first profile if none selected
          if (!wizardState.selectedProfileId && profilesArray.length > 0) {
            setWizardState((prev: WizardState) => ({
              ...prev,
              selectedProfileId: profilesArray[0].id
            }))
          }

          // Log retry count if there were retries (for monitoring)
          if (result.retryCount && result.retryCount > 0) {
            console.log(`Profiles fetched after ${result.retryCount} retry(ies)`)
          }
        } else {
          console.error('Failed to fetch profiles:', result.error)
        }
      } catch (optimizerError) {
        // Fallback: Direct fetch if optimizer fails
        console.warn('Optimizer failed, using direct fetch:', optimizerError)
        try {
          const response = await fetch('/api/profiles')
          if (response.ok) {
            const data = await response.json()
            // FIX: API returns { profiles: [...] }, extract the array
            const profilesArray = Array.isArray(data) ? data : (data.profiles || [])
            setProfiles(profilesArray)
            if (!wizardState.selectedProfileId && profilesArray.length > 0) {
              setWizardState((prev: WizardState) => ({
                ...prev,
                selectedProfileId: profilesArray[0].id
              }))
            }
          }
        } catch (fetchError) {
          console.error('Direct fetch also failed:', fetchError)
        }
      }

      setIsLoadingProfiles(false)
    }
    loadProfiles()
  }, [])

  const togglePlatform = (platform: string) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }))
  }

  // Remove emojis from text
  const removeEmojis = (text: string): string => {
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F190}-\u{1F1FF}]/gu, '')
  }

  // Get content for preview - check if user has edited it, otherwise use generated content
  const getContentForPlatform = (platform: string) => {
    // If user has edited content for this platform, use that
    if (wizardState.editableContentByPlatform[platform]) {
      return wizardState.editableContentByPlatform[platform]
    }
    
    // Otherwise use generated content without emojis
    const content = wizardState.generatedContentByTemplate[wizardState.selectedTemplates[0]?.id]?.content || ''
    const cleanContent = removeEmojis(content)
    
    // Initialize editable content with clean version
    if (content && !wizardState.editableContentByPlatform[platform]) {
      setWizardState((prev: WizardState) => ({
        ...prev,
        editableContentByPlatform: {
          ...prev.editableContentByPlatform,
          [platform]: cleanContent
        }
      }))
    }
    
    return cleanContent
  }

  // Update content for a specific platform
  const updatePlatformContent = (platform: string, newContent: string) => {
    setWizardState((prev: WizardState) => ({
      ...prev,
      editableContentByPlatform: {
        ...prev.editableContentByPlatform,
        [platform]: newContent
      }
    }))
  }

  // Get graphic URL for preview
  const getGraphicUrl = () => {
    const templateId = wizardState.selectedTemplates[0]?.id
    return templateId ? wizardState.generatedGraphicUrls[templateId] : null
  }

  // Platform-specific character limits and formatting
  const platformLimits: Record<string, { limit: number; description: string }> = {
    twitter: { limit: 280, description: 'Character limit' },
    linkedin: { limit: 3000, description: 'Character limit' },
    facebook: { limit: 63206, description: 'Character limit (recommended: 250)' },
    instagram: { limit: 2200, description: 'Caption limit' },
    youtube: { limit: 5000, description: 'Description limit' },
    tiktok: { limit: 2200, description: 'Caption limit' },
    threads: { limit: 500, description: 'Character limit' },
    bluesky: { limit: 300, description: 'Character limit' }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            Select Profile
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Choose which business profile to post from</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProfiles ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading profiles...
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-sm text-gray-500">
              No profiles found. Please create a profile in Settings.
            </div>
          ) : (
            <Select
              value={wizardState.selectedProfileId || ''}
              onValueChange={(value) =>
                setWizardState((prev: WizardState) => ({ ...prev, selectedProfileId: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Select Platforms
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Choose where to publish your post</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            {Object.entries(platformIcons).map(([key, info]) => (
              <div
                key={key}
                onClick={() => togglePlatform(key)}
                className={`border-2 rounded-lg p-2 sm:p-3 lg:p-4 cursor-pointer transition-all ${
                  wizardState.selectedPlatforms.includes(key)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Checkbox checked={wizardState.selectedPlatforms.includes(key)} className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={info.color + " flex-shrink-0"}>{info.icon}</span>
                    <span className="font-medium text-xs sm:text-sm truncate">{info.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Previews - Mobile Responsive */}
      {wizardState.selectedPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              Platform Previews
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              See how your post will look on each platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {wizardState.selectedPlatforms.map((platform: string) => {
                const info = platformIcons[platform]
                const content = getContentForPlatform(platform)
                const graphicUrl = getGraphicUrl()
                const limit = platformLimits[platform]
                const characterCount = content.length
                const isOverLimit = characterCount > limit.limit

                return (
                  <Card key={platform} className="border-2">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                          <span className={info.color + " flex-shrink-0"}>{info.icon}</span>
                          <span className="font-semibold text-xs sm:text-sm truncate">{info.name}</span>
                        </div>
                        <Badge variant={isOverLimit ? 'destructive' : 'secondary'} className="text-[10px] sm:text-xs flex-shrink-0">
                          {characterCount}/{limit.limit}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">{limit.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 sm:p-4">
                      {/* Platform-specific preview card */}
                      <div className={`rounded-lg p-2 sm:p-3 lg:p-4 min-h-[120px] sm:min-h-[150px] ${
                        platform === 'twitter' ? 'bg-gray-50 border border-gray-200' :
                        platform === 'linkedin' ? 'bg-blue-50 border border-blue-200' :
                        platform === 'facebook' ? 'bg-gray-50 border border-gray-200' :
                        platform === 'instagram' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200' :
                        platform === 'youtube' ? 'bg-red-50 border border-red-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        {/* Template Image Preview */}
                        {graphicUrl && (
                          <div className="mb-2 sm:mb-3">
                            <img 
                              src={graphicUrl} 
                              alt="Post preview"
                              className="w-full h-auto rounded border"
                            />
                          </div>
                        )}
                        
                        {/* Content Preview - Editable */}
                        <div className="space-y-1.5 sm:space-y-2">
                          {content ? (
                            <>
                              <Textarea
                                value={content}
                                onChange={(e) => updatePlatformContent(platform, e.target.value)}
                                className={`text-xs sm:text-sm whitespace-pre-wrap break-words min-h-[100px] sm:min-h-[120px] resize-y ${
                                  isOverLimit ? 'text-red-600 border-red-300 focus:border-red-500' : 'text-gray-700'
                                }`}
                                placeholder="Edit your post content here..."
                              />
                              {isOverLimit && (
                                <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                                  ⚠️ Content exceeds {platform} character limit by {characterCount - limit.limit} characters
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-400 italic">
                              No content generated yet. Generate content in Step 4 to see preview.
                            </p>
                          )}
                        </div>

                        {/* Platform-specific metadata */}
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                          {platform === 'twitter' && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <MessageSquare className="w-3 h-3" />
                              <span>Tweet</span>
                            </div>
                          )}
                          {platform === 'linkedin' && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>Professional post</span>
                            </div>
                          )}
                          {platform === 'facebook' && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <Share2 className="w-3 h-3" />
                              <span>Facebook post</span>
                            </div>
                          )}
                          {platform === 'instagram' && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <ImageIcon className="w-3 h-3" />
                              <span>Instagram post</span>
                            </div>
                          )}
                          {platform === 'youtube' && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <Video className="w-3 h-3" />
                              <span>Video description</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Step6ScheduleReview({ wizardState, setWizardState, toast }: any) {
  const [isPosting, setIsPosting] = useState(false)

  const handlePost = async () => {
    setIsPosting(true)
    try {
      // Get the first template's graphic URL and content
      const firstTemplateId = wizardState.selectedTemplates[0]?.id
      const graphicUrl = firstTemplateId ? wizardState.generatedGraphicUrls[firstTemplateId] : null
      // FIX: Get content from generatedContentByTemplate, not generatedContent (which is never populated)
      const content = firstTemplateId
        ? wizardState.generatedContentByTemplate[firstTemplateId]
        : { content: '', caption: '', hashtags: '' }

      if (!graphicUrl) {
        throw new Error('No graphic generated. Please generate a graphic first.')
      }

      if (!content?.content) {
        throw new Error('No content generated. Please generate content first.')
      }

      // Use optimized posting with automatic retry and error handling
      const result = await postToAllPlatformsOptimized(
        wizardState,
        graphicUrl,
        content
      )

      // Show result to user
      if (result.successCount > 0) {
        toast({
          title: 'Success!',
          description: result.failedPlatforms.length > 0
            ? `Posted to ${result.successCount} platform(s). Failed: ${result.failedPlatforms.join(', ')}`
            : `Post published to ${result.successCount} platform(s)!`
        })

        // Log any errors for debugging
        if (Object.keys(result.errors).length > 0) {
          console.warn('Platform posting errors:', result.errors)
        }
      } else {
        // All platforms failed - show specific error messages
        const errorMessages = Object.entries(result.errors)
          .map(([platform, error]) => `${platform}: ${error}`)
          .join('; ')
        throw new Error(`Failed to post to any platforms. ${errorMessages}`)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive'
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule & Review
        </CardTitle>
        <CardDescription>Final review and scheduling options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Schedule Type</Label>
          <Select
            value={wizardState.scheduleType}
            onValueChange={(value) =>
              setWizardState((prev: WizardState) => ({ ...prev, scheduleType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Post Now</SelectItem>
              <SelectItem value="scheduled">Schedule for Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {wizardState.scheduleType === 'scheduled' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={wizardState.scheduledDate}
                onChange={(e) =>
                  setWizardState((prev: WizardState) => ({ ...prev, scheduledDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={wizardState.scheduledTime}
                onChange={(e) =>
                  setWizardState((prev: WizardState) => ({ ...prev, scheduledTime: e.target.value }))
                }
              />
            </div>
          </div>
        )}

        <Button onClick={handlePost} disabled={isPosting} className="w-full gap-2" size="lg">
          {isPosting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Publish Post
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}